# AI / PYTHON PLAN — Beauty & Care Shopping Website
## Stack: Python, FastAPI, MongoDB Atlas Vector Search (or local cosine similarity), Sentence Transformers, LangChain (optional)

---

## ARCHITECTURE OVERVIEW

```
ai-service/
├── main.py                     # FastAPI app entry point
├── config.py                   # Settings from .env
├── requirements.txt
├── .env
├── routers/
│   ├── chat.py                 # Chat endpoint
│   ├── recommend.py            # Recommendation endpoints
│   └── embed.py                # Internal: generate & store embeddings
├── services/
│   ├── embedder.py             # Sentence transformer model wrapper
│   ├── vector_search.py        # MongoDB vector search / cosine similarity
│   ├── chatbot.py              # Chatbot logic with context
│   └── product_fetcher.py      # Queries MongoDB for product data
├── models/
│   ├── schemas.py              # Pydantic request/response models
│   └── session_store.py        # In-memory conversation sessions
└── scripts/
    └── generate_embeddings.py  # One-time script to embed all products
```

---

## WHAT IS A VECTOR EMBEDDING? (For your understanding)

A product like "Himalaya Moisturizing Face Cream for dry skin" gets converted into a list of ~384 numbers (a vector) by a pre-trained language model. Two products that are semantically similar (e.g., both are moisturizers for dry skin) will have vectors that are mathematically close to each other. This enables:
- "Show me something similar to this product" → find close vectors
- "Recommend products for dry skin" → embed the query → find close product vectors
- Chatbot that understands "something for my oily face" without exact keyword match

---

## PHASE A-01: Python Service Setup & MongoDB Connection
**Goal:** FastAPI service running, connected to same MongoDB used by backend.
**Depends on:** B-01 (MongoDB must be running)

### Steps:
1. Create `/ai-service/` directory
2. `requirements.txt`:
   ```
   fastapi==0.115.0
   uvicorn==0.30.0
   pymongo==4.8.0
   sentence-transformers==3.0.1
   python-dotenv==1.0.1
   pydantic==2.8.0
   numpy==1.26.4
   scikit-learn==1.5.0
   httpx==0.27.0
   ```
3. Install: `pip install -r requirements.txt`
4. `config.py`:
   ```python
   from pydantic_settings import BaseSettings
   class Settings(BaseSettings):
       MONGO_URI: str
       DB_NAME: str = "beautystore"
       PRODUCTS_COLLECTION: str = "products"
       MODEL_NAME: str = "all-MiniLM-L6-v2"  # fast, 384-dim, good quality
       class Config:
           env_file = ".env"
   settings = Settings()
   ```
5. `main.py`:
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   from routers import chat, recommend, embed
   
   app = FastAPI(title="Beauty Store AI Service")
   app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5000"], allow_methods=["*"])
   app.include_router(chat.router, prefix="/chat")
   app.include_router(recommend.router, prefix="/recommend")
   app.include_router(embed.router, prefix="/embed")
   
   @app.get("/health")
   def health(): return {"status": "ok"}
   ```
6. Run: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

### .env for AI service:
```
MONGO_URI=mongodb://localhost:27017/beautystore
DB_NAME=beautystore
```

### End Goal:
FastAPI server running on port 8000, MongoDB connected, `/health` returns 200.

---

## PHASE A-02: Sentence Transformer — Embedding Model Setup
**Goal:** Load and cache the embedding model. Able to generate embeddings for text.
**Depends on:** A-01

### Implementation:
```python
# services/embedder.py
from sentence_transformers import SentenceTransformer
import numpy as np

class EmbeddingService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # Model downloads on first run (~90MB), cached afterward
            cls._instance.model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._instance
    
    def embed(self, text: str) -> list[float]:
        """Convert text to 384-dimensional vector."""
        vec = self.model.encode(text, normalize_embeddings=True)
        return vec.tolist()
    
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Batch embed for efficiency during seeding."""
        vecs = self.model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=True)
        return vecs.tolist()
    
    def cosine_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        a, b = np.array(vec_a), np.array(vec_b)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

embedder = EmbeddingService()  # singleton
```

### What text to embed for each product:
```python
def build_product_text(product: dict) -> str:
    """Build a rich text representation of a product for embedding."""
    parts = [
        product.get('name', ''),
        product.get('brand', ''),
        product.get('category', ''),
        product.get('description', ''),
        ' '.join(product.get('tags', [])),
        ' '.join(product.get('details', {}).get('ingredients', [])),
        ' '.join(product.get('details', {}).get('benefits', [])),
        ' '.join(product.get('details', {}).get('skinType', [])),
    ]
    return ' '.join(filter(None, parts))
```

### End Goal:
Can call `embedder.embed("moisturizer for dry skin")` → returns list of 384 floats. Fast and cached.

---

## PHASE A-03: Generate & Store Product Embeddings
**Goal:** All 30 products have their embeddings stored in MongoDB. One-time setup script.
**Depends on:** A-02, B-04 (products seeded in MongoDB)

### Why store embeddings in MongoDB:
MongoDB supports vector search natively (Atlas) or we implement cosine similarity manually. Storing embeddings IN the product document keeps everything in one DB.

### Script:
```python
# scripts/generate_embeddings.py
import asyncio
from pymongo import MongoClient
from services.embedder import embedder, build_product_text

def generate_all_embeddings():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["beautystore"]
    products = list(db.products.find({}, {'_id': 1, 'name': 1, 'category': 1,
                                          'description': 1, 'tags': 1, 'details': 1, 'brand': 1}))
    print(f"Embedding {len(products)} products...")
    
    texts = [build_product_text(p) for p in products]
    embeddings = embedder.embed_batch(texts)
    
    for product, embedding in zip(products, embeddings):
        db.products.update_one(
            {'_id': product['_id']},
            {'$set': {'embedding': embedding}}
        )
        print(f"  ✓ {product['name']}")
    
    print(f"Done. Embedded {len(products)} products.")

if __name__ == '__main__':
    generate_all_embeddings()
```

Run with: `python scripts/generate_embeddings.py`

### Vector Search Service:
```python
# services/vector_search.py
from pymongo import MongoClient
from services.embedder import embedder
import numpy as np

class VectorSearchService:
    def __init__(self):
        client = MongoClient("mongodb://localhost:27017/")
        self.db = client["beautystore"]
        self.products = self.db.products
    
    def find_similar(self, query_text: str, top_k: int = 6, exclude_id: str = None, category: str = None) -> list[dict]:
        """Find products most similar to query text."""
        query_vec = np.array(embedder.embed(query_text))
        
        # Build filter
        filter_query = {'embedding': {'$exists': True, '$ne': None}}
        if exclude_id: filter_query['_id'] = {'$ne': exclude_id}
        if category: filter_query['category'] = category
        
        # Fetch all products with embeddings (30 products — perfectly fine for cosine sim)
        all_products = list(self.products.find(filter_query, {'embedding': 1, 'name': 1, 'category': 1, 'price': 1, 'rating': 1, 'images': 1}))
        
        # Compute cosine similarities
        scored = []
        for p in all_products:
            if p.get('embedding'):
                p_vec = np.array(p['embedding'])
                score = float(np.dot(query_vec, p_vec))  # normalized vecs → dot product = cosine sim
                scored.append((score, str(p['_id'])))
        
        scored.sort(reverse=True)
        top_ids = [s[1] for s in scored[:top_k]]
        return top_ids  # Return IDs; backend fetches full details from Node.js or directly
    
    def find_popular(self, category: str = None, top_k: int = 6) -> list[str]:
        """Fallback: return top rated products when no user context."""
        filter_q = {}
        if category: filter_q['category'] = category
        products = list(self.products.find(filter_q, {'_id': 1}).sort('rating', -1).limit(top_k))
        return [str(p['_id']) for p in products]

vector_search = VectorSearchService()
```

### Recommendation API Endpoint:
```python
# routers/recommend.py
from fastapi import APIRouter
from services.vector_search import vector_search
from pydantic import BaseModel

router = APIRouter()

class HomepageRecRequest(BaseModel):
    userId: str | None = None
    purchasedIds: list[str] = []

@router.post("/homepage")
def homepage_recommendations(req: HomepageRecRequest):
    if not req.purchasedIds:
        # No purchase history → return top-rated popular products
        ids = vector_search.find_popular(top_k=8)
    else:
        # Use purchased products as query context → find semantically similar
        # Simple approach: embed last 3 purchased product names combined
        from pymongo import MongoClient
        from bson import ObjectId
        client = MongoClient("mongodb://localhost:27017/")
        db = client["beautystore"]
        recent = list(db.products.find(
            {'_id': {'$in': [ObjectId(i) for i in req.purchasedIds[-3:]]}},
            {'name': 1, 'tags': 1, 'category': 1}
        ))
        context_text = ' '.join([f"{p['name']} {' '.join(p.get('tags',[]))}" for p in recent])
        ids = vector_search.find_similar(context_text, top_k=8, exclude_id=None)
    return {"productIds": ids}

@router.get("/similar/{product_id}")
def similar_products(product_id: str):
    from pymongo import MongoClient
    from bson import ObjectId
    client = MongoClient("mongodb://localhost:27017/")
    db = client["beautystore"]
    product = db.products.find_one({'_id': ObjectId(product_id)}, {'name': 1, 'tags': 1, 'description': 1, 'category': 1})
    if not product:
        return {"productIds": []}
    query_text = f"{product['name']} {' '.join(product.get('tags', []))} {product.get('description','')}"
    ids = vector_search.find_similar(query_text, top_k=6, exclude_id=product_id)
    return {"productIds": ids}
```

### End Goal:
All products have embeddings. `/recommend/homepage` returns 8 relevant product IDs. `/recommend/similar/:id` returns 6 similar product IDs.

---

## PHASE A-04: AI Chatbot
**Goal:** Conversational product assistant that answers shopping questions and recommends products.
**Depends on:** A-02, A-03

### Chatbot Strategy:
Use a **retrieval-augmented generation (RAG)** approach:
1. User sends message: "I need something for my oily skin under ₹500"
2. Embed the query → find top 5 similar products from MongoDB
3. Build a prompt with those products as context
4. Call Anthropic/OpenAI API (or use a smaller local model) with the context prompt
5. Return text response + product IDs

### Session Management (in-memory):
```python
# models/session_store.py
from collections import defaultdict
from datetime import datetime, timedelta

class SessionStore:
    def __init__(self):
        self._sessions: dict[str, list] = defaultdict(list)
        self._last_access: dict[str, datetime] = {}
    
    def get_history(self, session_id: str) -> list:
        self._last_access[session_id] = datetime.now()
        return self._sessions[session_id]
    
    def add_message(self, session_id: str, role: str, content: str):
        self._sessions[session_id].append({"role": role, "content": content})
        if len(self._sessions[session_id]) > 20:
            self._sessions[session_id] = self._sessions[session_id][-20:]
    
    def cleanup_old(self):
        cutoff = datetime.now() - timedelta(hours=2)
        old = [sid for sid, t in self._last_access.items() if t < cutoff]
        for sid in old:
            del self._sessions[sid]
            del self._last_access[sid]

session_store = SessionStore()
```

### Chatbot Service (NO external LLM — rule-based + semantic search):
Since you mentioned JS + Python knowledge (no LLM API key mentioned), implement a smart rule-based + semantic chatbot:

```python
# services/chatbot.py
import re
from services.vector_search import vector_search
from models.session_store import session_store
from pymongo import MongoClient
from bson import ObjectId

INTENT_PATTERNS = {
    'greeting': r'\b(hi|hello|hey|hii)\b',
    'recommendation': r'\b(recommend|suggest|show|find|need|want|looking for)\b',
    'price_filter': r'under ₹?(\d+)|below ₹?(\d+)|less than ₹?(\d+)',
    'category_face': r'\bface\b|\bskin\b|\bfacial\b',
    'category_body': r'\bbody\b|\bskin care\b|\blotion\b',
    'category_hair': r'\bhair\b|\bscalp\b|\bshampoo\b',
    'skin_type_oily': r'\boily\b',
    'skin_type_dry': r'\bdry\b',
    'skin_type_combination': r'\bcombination\b|\bcombined\b',
    'farewell': r'\b(bye|goodbye|thanks|thank you)\b',
}

class ChatbotService:
    def __init__(self):
        self.client = MongoClient("mongodb://localhost:27017/")
        self.db = self.client["beautystore"]
    
    def detect_intent(self, message: str) -> dict:
        m = message.lower()
        intents = {}
        for intent, pattern in INTENT_PATTERNS.items():
            match = re.search(pattern, m)
            if match:
                intents[intent] = match.group(0)
                if 'price_filter' in intent:
                    nums = re.findall(r'\d+', m)
                    intents['max_price'] = int(nums[0]) if nums else None
        return intents
    
    def respond(self, session_id: str, user_message: str, user_id: str = None) -> dict:
        session_store.add_message(session_id, 'user', user_message)
        history = session_store.get_history(session_id)
        intents = self.detect_intent(user_message)
        
        # Greeting
        if 'greeting' in intents and len(history) <= 2:
            reply = "Hi! I'm your beauty assistant 💄 I can help you find the perfect skincare, haircare, or body care products. What are you looking for today?"
            session_store.add_message(session_id, 'assistant', reply)
            return {"reply": reply, "products": []}
        
        # Farewell
        if 'farewell' in intents:
            reply = "Happy shopping! Feel free to ask anytime you need product recommendations. 😊"
            session_store.add_message(session_id, 'assistant', reply)
            return {"reply": reply, "products": []}
        
        # Product recommendation or search
        # Embed the query and find similar products
        similar_ids = vector_search.find_similar(user_message, top_k=4)
        
        # Apply price filter if detected
        product_filter = {'_id': {'$in': [ObjectId(i) for i in similar_ids]}}
        if intents.get('max_price'):
            product_filter['price'] = {'$lte': intents['max_price']}
        
        products = list(self.db.products.find(product_filter, {
            '_id': 1, 'name': 1, 'price': 1, 'category': 1, 'rating': 1, 'images': 1, 'brand': 1
        }))
        
        if not products:
            reply = "I couldn't find products matching that exactly. Could you tell me more? For example, your skin type (oily/dry/combination) or your budget?"
        else:
            context = ", ".join([p['name'] for p in products[:3]])
            cat_msg = ""
            if 'category_face' in intents: cat_msg = " for your face"
            elif 'category_hair' in intents: cat_msg = " for your hair"
            elif 'category_body' in intents: cat_msg = " for your body"
            price_msg = f" under ₹{intents['max_price']}" if intents.get('max_price') else ""
            reply = f"Here are some great picks{cat_msg}{price_msg} I found for you! These are highly rated and match what you're looking for."
        
        product_ids = [str(p['_id']) for p in products]
        session_store.add_message(session_id, 'assistant', reply)
        return {"reply": reply, "products": product_ids}

chatbot_service = ChatbotService()
```

### Chat Router:
```python
# routers/chat.py
from fastapi import APIRouter
from pydantic import BaseModel
from services.chatbot import chatbot_service
import uuid

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    sessionId: str | None = None
    userId: str | None = None

@router.post("/")
def chat(req: ChatRequest):
    session_id = req.sessionId or str(uuid.uuid4())
    result = chatbot_service.respond(session_id, req.message, req.userId)
    return {"sessionId": session_id, "reply": result["reply"], "productIds": result["products"]}
```

### Upgrade Path (Optional — add later):
When you want a real LLM-powered chatbot, swap the `respond` method to call OpenAI/Anthropic API:
```python
import anthropic
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
# Include retrieved product context in the system prompt
# Pass conversation history
# Return the model's text response
```

### End Goal:
Chatbot understands product-related queries, uses semantic search to find relevant products, maintains conversation context per session, returns product IDs that frontend renders as cards.

---

## PHASE A-05: Embedding Route (Admin Tool)
**Goal:** HTTP endpoint to re-generate embeddings when products are updated.
**Depends on:** A-02, A-03

```python
# routers/embed.py
from fastapi import APIRouter, Header, HTTPException
from services.embedder import embedder, build_product_text
from pymongo import MongoClient
from bson import ObjectId
import os

router = APIRouter()

@router.post("/product/{product_id}")
def embed_product(product_id: str, x_internal_key: str = Header(...)):
    """Called by Express backend when a product is created or updated."""
    if x_internal_key != os.environ.get("INTERNAL_API_KEY", "dev-key"):
        raise HTTPException(403, "Forbidden")
    
    client = MongoClient("mongodb://localhost:27017/")
    db = client["beautystore"]
    product = db.products.find_one({'_id': ObjectId(product_id)})
    if not product:
        raise HTTPException(404, "Product not found")
    
    text = build_product_text(product)
    embedding = embedder.embed(text)
    db.products.update_one({'_id': ObjectId(product_id)}, {'$set': {'embedding': embedding}})
    return {"status": "embedded", "productId": product_id}

@router.post("/all")
def embed_all(x_internal_key: str = Header(...)):
    """Re-embed all products — run when products change significantly."""
    if x_internal_key != os.environ.get("INTERNAL_API_KEY", "dev-key"):
        raise HTTPException(403, "Forbidden")
    
    client = MongoClient("mongodb://localhost:27017/")
    db = client["beautystore"]
    products = list(db.products.find({}))
    texts = [build_product_text(p) for p in products]
    embeddings = embedder.embed_batch(texts)
    for product, embedding in zip(products, embeddings):
        db.products.update_one({'_id': product['_id']}, {'$set': {'embedding': embedding}})
    return {"status": "done", "count": len(products)}
```

### End Goal:
When you add new products via admin or seeding, one API call re-embeds them. No manual script run needed.

---

## HIGH-LEVEL DESIGN NOTES (AI)

### Model Choice Rationale:
- `all-MiniLM-L6-v2`: 80MB download, runs on CPU, 384-dim vectors, excellent for semantic similarity
- Inference time: ~5ms per embedding on CPU — fast enough for real-time queries
- No GPU needed, no API key needed, free to run

### Vector DB Options (in order of complexity):
1. **MongoDB cosine similarity (current plan)**: Store embedding array in product document → Python computes cosine sim on 30 items → <5ms. Perfect for 30-300 products.
2. **MongoDB Atlas Vector Search**: If you deploy to Atlas, use `$vectorSearch` aggregation stage. No code change in FastAPI, just a MongoDB index change.
3. **ChromaDB** (future): `pip install chromadb` → dedicated vector DB, works locally, good for 10k+ products.

### Why not LangChain for now:
LangChain adds complexity. For 30 products, direct similarity search + rule-based intent detection is faster, more debuggable, and impressive enough for a portfolio project.

### Testing AI service:
```bash
# Test health
curl http://localhost:8000/health

# Test recommendation
curl -X POST http://localhost:8000/recommend/homepage \
  -H "Content-Type: application/json" \
  -d '{"userId": null, "purchasedIds": []}'

# Test chat
curl -X POST http://localhost:8000/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "I need a moisturizer for dry skin", "sessionId": "test123"}'
```
