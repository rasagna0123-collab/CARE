# MASTER COMBINED PLAN — Beauty & Care Shopping Website
## End-to-End MERN + AI | Phase-by-Phase Execution Guide

---

## PROJECT OVERVIEW

**What you're building:** A full-featured beauty & skincare e-commerce platform with 30 products (face care, body care, hair care), AI-powered recommendations, a conversational chatbot with voice input, and all core e-commerce features.

**4 Parallel Tracks:**
| Track | File | Tech |
|-------|------|------|
| Frontend | `frontend-1.md` | React + Redux + TailwindCSS |
| Backend | `backend-1.md` | Node.js + Express + MongoDB |
| AI/Python | `ai-python-1.md` | FastAPI + Sentence Transformers |
| This file | `combined-1.md` | Cross-track execution order |

---

## HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
│   React Frontend    │◄──────►│   Express Backend    │◄──────►│  FastAPI AI Service  │
│   localhost:5173    │  HTTP  │   localhost:5000     │  HTTP  │   localhost:8000     │
│                     │        │                      │        │                      │
│  Redux Store        │        │  JWT Auth            │        │  Sentence Transformer│
│  TailwindCSS        │        │  Mongoose Models     │        │  Vector Search       │
│  React Router       │        │  REST API            │        │  Chatbot Engine      │
└─────────────────────┘        └──────────┬───────────┘        └──────────────────────┘
                                           │
                                           ▼
                               ┌──────────────────────┐
                               │      MongoDB         │
                               │   localhost:27017    │
                               │                      │
                               │  users               │
                               │  products (+ vec.)   │
                               │  orders              │
                               │  reviews             │
                               │  carts               │
                               │  banners             │
                               └──────────────────────┘
```

---

## PHASE DEPENDENCY MAP

```
B-01 ──► B-02 ──► B-03 ──► B-04 ──► B-05 ──► B-06 ──► B-07 ──► B-08 ──► B-09
  │         │
  │         └──────────────────► A-01 ──► A-02 ──► A-03 ──► A-04 ──► A-05
  │                                                   │
F-01 ──► F-02 ──► F-03 ──► F-04 ──► F-05 ──► F-06 ──► F-07 ──► F-08 ──► F-09 ──► F-10
                    │         │         │         │
                    └─────────┴─────────┴─────────┘ (all need F-07 ProductCard)
```

**Critical rule:** Never start a phase if a dependency is not fully working and tested.

---

## RECOMMENDED EXECUTION ORDER

### WEEK 1 — Infrastructure & Core Backend

#### STEP 001 — Backend Setup
**Phase:** B-01  
**Track:** Backend  
**Time estimate:** 2–3 hours  
**What to do:** Create `/backend` folder, initialize Node project, install Express, Mongoose, JWT, bcrypt, helmet, morgan, cors. Create `server.js`, `config/db.js`, `middlewares/error.middleware.js`, `utils/asyncHandler.js`, `utils/apiResponse.js`. Set up `.env`. Write health check endpoint.  
**Test:** `GET http://localhost:5000/api/health` returns `{ status: 'ok' }`.  
**Blocker if skipped:** Everything else in backend fails.

---

#### STEP 002 — MongoDB Data Models
**Phase:** B-02  
**Track:** Backend  
**Depends on:** STEP 001  
**Time estimate:** 3–4 hours  
**What to do:** Create all 6 Mongoose schemas: User (with bcrypt pre-save, comparePassword method), Product (with text index and embedding field), Order, Review (with post-save rating recalculation), Cart, Banner. Create all model files in `src/models/`.  
**Test:** Import each model in a test script, `new Model({}).validateSync()` to check required fields.  
**Blocker if skipped:** No data can be saved.

---

#### STEP 003 — Product Seeding
**Phase:** B-04 (seed portion)  
**Track:** Backend  
**Depends on:** STEP 002  
**Time estimate:** 3–4 hours  
**What to do:** Write `scripts/seed.js`. Create 30 product objects (10 per category) with realistic names, brands, prices (₹199–₹1499), descriptions, tags, ingredients, benefits, skinType arrays. Create 3 banners. Create admin user. Run: `node scripts/seed.js`.  
**Important:** Use YOUR product images and data (as you mentioned, data collection is on your end). Put image filenames in the `images` array — you'll serve them from `/uploads/` after B-07.  
**Test:** Open MongoDB Compass → beautystore DB → products collection → 30 documents exist.  
**Blocker if skipped:** Frontend and AI have nothing to display.

---

#### STEP 004 — Auth Routes (Register, Login, Me)
**Phase:** B-03  
**Track:** Backend  
**Depends on:** STEP 002  
**Time estimate:** 3–4 hours  
**What to do:** Create `routes/auth.routes.js`, `controllers/auth.controller.js`. Implement `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. Create `verifyToken` and `optionalAuth` middlewares. Add validation with express-validator.  
**Test:**
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Test@1234"}'
# Returns { token: "...", user: {...} }

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}'
```

---

#### STEP 005 — Product API with Filters
**Phase:** B-04  
**Track:** Backend  
**Depends on:** STEP 003  
**Time estimate:** 4–5 hours  
**What to do:** Create `routes/product.routes.js`, `controllers/product.controller.js`. Implement `GET /api/products` with full query builder (category, price range, rating, sort, search, featured, deal, pagination). Implement `GET /api/products/:id`.  
**Test:**
```bash
curl "http://localhost:5000/api/products?category=face-care&priceMin=200&priceMax=1000&sort=rating-desc&page=1"
# Returns paginated product list

curl "http://localhost:5000/api/products?search=moisturizer"
# Returns products matching text search
```

---

### WEEK 1–2 — Frontend Foundation

#### STEP 006 — React Project Setup
**Phase:** F-01  
**Track:** Frontend  
**Depends on:** Nothing (can run parallel to STEP 001–005)  
**Time estimate:** 2–3 hours  
**What to do:** `npm create vite@latest frontend -- --template react`. Install react-router-dom, @reduxjs/toolkit, react-redux, axios, tailwindcss, react-hot-toast, react-icons. Configure Tailwind. Create Redux store with empty slices. Create `src/services/api.js` Axios instance. Set up all page placeholder routes in `App.jsx`. Create `.env` with `VITE_API_URL=http://localhost:5000/api`.  
**Test:** `npm run dev` → app loads at localhost:5173, all routes navigate without errors.

---

#### STEP 007 — Layout: Navbar + Footer
**Phase:** F-02  
**Track:** Frontend  
**Depends on:** STEP 006  
**Time estimate:** 3–4 hours  
**What to do:** Build `Navbar.jsx` with logo, search bar (debounced, navigates to /products?search=), cart icon with count badge (shows 0 for now), user dropdown (shows Login/Signup for now, will update in STEP 011). Build `Footer.jsx`. Create `Layout.jsx` wrapping both. Configure React Router to use Layout via `<Outlet/>`.  
**Test:** Navigate between pages → Navbar always visible. Search bar navigates to `/products?search=yourquery`.

---

#### STEP 008 — ProductCard Component
**Phase:** F-07  
**Track:** Frontend  
**Depends on:** STEP 006  
**Time estimate:** 2–3 hours  
**What to do:** Build `components/product/ProductCard.jsx`. Takes `product` prop. Shows image, name (2-line truncate), stars rating, price with discount strikethrough, "Add to Cart" button. Include lazy image loading. Skeleton version for loading state.  
**Why now:** ProductCard is needed by home page, product listing page, and recommendation sections — build it early.  
**Test:** Render with a mock product object → displays correctly.

---

#### STEP 009 — Products Listing Page with Filters
**Phase:** F-04  
**Track:** Frontend  
**Depends on:** STEP 005 (backend), STEP 007, STEP 008  
**Time estimate:** 5–6 hours  
**What to do:** Build `pages/Products.jsx`. Implement URL-first filter state: read query params → set Redux filterSlice → on change update URL → re-fetch products. Build `FilterPanel.jsx` (sidebar) with category radio, price range slider, rating checkboxes, sort dropdown. Build `FilterChip` bar showing active filters. Show result count and pagination.  
**Test:**
1. Navigate to `/products` → shows all 30 products
2. Select "Face Care" filter → URL changes to `/products?category=face-care` → 10 products shown
3. Add price filter → products narrow further
4. Refresh page → filters preserved
5. Browser back → previous filters restored

---

#### STEP 010 — Home Page
**Phase:** F-03  
**Track:** Frontend  
**Depends on:** STEP 005, STEP 008  
**Time estimate:** 4–5 hours  
**What to do:** Build 5 sections: Hero Banner Carousel (fetches `GET /api/banners`), Category Shortcuts, Featured Products Row (fetches `GET /api/products?featured=true&limit=8`), Deals Row (`GET /api/products?deal=true&limit=6`), AI Recommendations placeholder (will be real after STEP 017). Each section has its own data fetch, loading skeleton, and error state.  
**Test:** Home page loads → all sections show content from database → carousel auto-rotates every 4s.

---

#### STEP 011 — Auth: Signup, Login, Logout
**Phase:** F-05  
**Track:** Frontend  
**Depends on:** STEP 004 (backend auth), STEP 006  
**Time estimate:** 4–5 hours  
**What to do:** Create `authSlice.js` with user/token state. Create `LoginForm.jsx` and `SignupForm.jsx` with validation. Create `ProtectedRoute.jsx`. On app load, read token from localStorage → validate via `GET /api/auth/me` → populate Redux. After login, attach token to all Axios requests via interceptor. Update Navbar to show user dropdown when logged in.  
**Test:**
1. Sign up → logged in, user name in navbar
2. Refresh → still logged in
3. Navigate to `/orders` without login → redirected to `/login`
4. Login → redirected back to `/orders`
5. Logout → token cleared, navbar shows Login link

---

#### STEP 012 — Cart: Add, Update, Remove
**Phase:** F-06  
**Track:** Frontend  
**Depends on:** STEP 011, STEP 005 (for Cart backend — B-05)  
**Time estimate:** 4–5 hours  
**What to do:** Create `cartSlice.js`. "Add to Cart" in ProductCard dispatches to Redux and shows toast. Build `CartDrawer.jsx` sliding from right with item list, qty controls, remove buttons, subtotal, checkout link. Persist cart to localStorage. On login, call `POST /api/cart/merge` to sync guest cart with server.  
**Test:**
1. Add product → cart badge count increases → toast appears
2. Open cart drawer → item shows with correct price
3. Change qty → subtotal updates instantly
4. Remove item → item disappears
5. Refresh → cart still there (localStorage)

---

### WEEK 2 — AI Service

#### STEP 013 — Python AI Service Setup
**Phase:** A-01  
**Track:** AI/Python  
**Depends on:** STEP 003 (products seeded in MongoDB)  
**Time estimate:** 2–3 hours  
**What to do:** Create `/ai-service/` directory. Create `requirements.txt` with all dependencies. Create `main.py` with FastAPI, CORS (allow only localhost:5000), health endpoint. Create `config.py` with Settings class. Test MongoDB connection from Python.  
**Test:** `uvicorn main:app --port 8000 --reload` → `GET http://localhost:8000/health` returns `{"status":"ok"}`.

---

#### STEP 014 — Embedding Model & Product Embedding Generation
**Phase:** A-02 + A-03  
**Track:** AI/Python  
**Depends on:** STEP 013  
**Time estimate:** 3–4 hours  
**What to do:** Create `services/embedder.py` with Sentence Transformer singleton. Create `build_product_text()` function. Run `scripts/generate_embeddings.py` to embed all 30 products. Verify embeddings stored in MongoDB.  
**Note:** First run downloads the model (~90MB). Subsequent runs use cached version.  
**Test:**
```bash
python -c "from services.embedder import embedder; print(len(embedder.embed('test')))"
# Should print: 384
```
Check MongoDB → products collection → each product has `embedding` field with 384 numbers.

---

#### STEP 015 — Vector Search & Recommendation Endpoints
**Phase:** A-03 (recommendation routes)  
**Track:** AI/Python  
**Depends on:** STEP 014  
**Time estimate:** 3–4 hours  
**What to do:** Create `services/vector_search.py` with `find_similar()` and `find_popular()` methods. Create `routers/recommend.py` with `POST /recommend/homepage` and `GET /recommend/similar/:id`.  
**Test:**
```bash
# Similar products
curl http://localhost:8000/recommend/similar/SOME_PRODUCT_ID
# Returns: {"productIds": ["id1","id2","id3","id4","id5","id6"]}

# Homepage recommendations
curl -X POST http://localhost:8000/recommend/homepage \
  -H "Content-Type: application/json" \
  -d '{"purchasedIds":[]}'
# Returns top-rated products
```

---

#### STEP 016 — AI Chatbot
**Phase:** A-04  
**Track:** AI/Python  
**Depends on:** STEP 015  
**Time estimate:** 4–5 hours  
**What to do:** Create `models/session_store.py`. Create `services/chatbot.py` with intent detection patterns, `respond()` method. Create `routers/chat.py` with `POST /chat/` endpoint.  
**Test:**
```bash
curl -X POST http://localhost:8000/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message":"I need a moisturizer for dry skin under 500","sessionId":"test"}'
# Returns reply text + product IDs for dry-skin moisturizers under ₹500
```

---

### WEEK 2–3 — Connect AI to Backend & Frontend

#### STEP 017 — Backend AI Proxy Routes
**Phase:** B-08  
**Track:** Backend  
**Depends on:** STEP 016 (AI service running), STEP 004 (auth)  
**Time estimate:** 2–3 hours  
**What to do:** Add `recommendation.routes.js` and `chat.routes.js` to Express. Implement proxy controllers that forward to FastAPI (`http://localhost:8000`) and enrich responses. Fetch full product details from MongoDB before returning to frontend.  
**Test:**
```bash
curl http://localhost:5000/api/recommendations/homepage
# Returns full product objects (not just IDs)

curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"show me face care products","sessionId":"test"}'
```

---

#### STEP 018 — Connect Recommendations to Frontend
**Phase:** F-09 (recommendations part)  
**Track:** Frontend  
**Depends on:** STEP 017  
**Time estimate:** 3–4 hours  
**What to do:** Update Home page AI Recommendations section to fetch from `GET /api/recommendations/homepage`. Add "Similar Products" section in `ProductDetail.jsx` fetching `GET /api/recommendations/similar/:id`. Both use `ProductCard` to render results.  
**Test:** On home page → AI section shows relevant products. On product detail page → "Similar Products" shows related items.

---

#### STEP 019 — Chatbot Widget UI
**Phase:** F-09 (chatbot UI)  
**Track:** Frontend  
**Depends on:** STEP 017  
**Time estimate:** 4–5 hours  
**What to do:** Build `components/chatbot/ChatWidget.jsx` (floating button), `ChatWindow.jsx` (message list + input), `MessageBubble.jsx`. Connect to `POST /api/chat/message`. Implement voice input using Web Speech API. If response contains products, render ProductCard inside the chat. Add suggested quick replies.  
**Test:**
1. Chat bubble visible on all pages
2. Type "show face care products" → bot replies with product cards
3. Click microphone → speak "moisturizer for dry skin" → text fills → sends automatically

---

### WEEK 3 — Order Flow, Reviews, Backend Polish

#### STEP 020 — Cart & Order Backend
**Phase:** B-05  
**Track:** Backend  
**Depends on:** STEP 002, STEP 004  
**Time estimate:** 4–5 hours  
**What to do:** Create Cart and Order routes/controllers. Cart: get, sync, add item, remove item, merge. Order: create (with stock validation + price from DB), get history, get by ID, cancel. On order creation: deduct stock, add productIds to user.purchasedProducts, clear cart.  
**Test:**
```bash
# Create order (need auth token)
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliveryAddress":{"name":"Test","phone":"9999999999","street":"123 Main St","city":"Mumbai","state":"MH","pincode":"400001"}}'
# Returns created order
```

---

#### STEP 021 — Checkout & Order History Frontend
**Phase:** F-08  
**Track:** Frontend  
**Depends on:** STEP 020, STEP 011  
**Time estimate:** 4–5 hours  
**What to do:** Build `pages/Checkout.jsx` with 3-step stepper (Address → Review → Payment). Build `pages/OrderHistory.jsx` fetching and displaying past orders with status badges and product thumbnails.  
**Test:**
1. Add item to cart → go to checkout → fill address → review order → place order → success page
2. Go to Order History → placed order appears with "Processing" status

---

#### STEP 022 — Reviews Backend
**Phase:** B-06  
**Track:** Backend  
**Depends on:** STEP 002, STEP 020  
**Time estimate:** 2–3 hours  
**What to do:** Create Review routes. GET reviews for product (paginated). POST review (auth + purchase verification). Post-save hook updates product rating. DELETE own review.

---

#### STEP 023 — Reviews Frontend + ProductDetail
**Phase:** F-07 (ProductDetail) + F-10 (reviews)  
**Track:** Frontend  
**Depends on:** STEP 022, STEP 011  
**Time estimate:** 4–5 hours  
**What to do:** Build complete `pages/ProductDetail.jsx`: image gallery, full product info, add-to-cart with qty selector, similar products (from STEP 018), reviews section. Add review submission form (star rating + text) — only visible to verified purchasers.

---

#### STEP 024 — Image Upload
**Phase:** B-07  
**Track:** Backend  
**Depends on:** STEP 001  
**Time estimate:** 2–3 hours  
**What to do:** Configure Multer, create upload routes for product images and profile images. Serve `/uploads` as static. Update seed script to use actual uploaded images.  
**Note:** For dev, put your 30 product images in `/backend/uploads/` and reference them in seed data.

---

#### STEP 025 — Banner & Image Routes Wired Up
**Phase:** Backend additional  
**Track:** Backend  
**Depends on:** STEP 024  
**Time estimate:** 1–2 hours  
**What to do:** Create `GET /api/banners` returning active banners sorted by order. Seed 3 banners with your banner images. Home page carousel will now show real data.

---

#### STEP 026 — User Profile Frontend
**Phase:** F-10  
**Track:** Frontend  
**Depends on:** STEP 011  
**Time estimate:** 3–4 hours  
**What to do:** Build `pages/Profile.jsx`. Edit name, email, phone, profile picture upload. Saved addresses section (add/edit/delete). Change password form.

---

### WEEK 3–4 — Polish, Security, Performance

#### STEP 027 — Security Hardening
**Phase:** B-09  
**Track:** Backend  
**Depends on:** All backend phases  
**Time estimate:** 2–3 hours  
**What to do:** Add rate limiting (express-rate-limit) on all routes and stricter limits on auth routes. Verify all inputs use express-validator. Confirm no password fields ever returned. Add admin role check middleware to admin endpoints. Verify helmet is configured.

---

#### STEP 028 — AI Embedding Admin Route
**Phase:** A-05  
**Track:** AI/Python  
**Depends on:** STEP 014  
**Time estimate:** 1–2 hours  
**What to do:** Add `POST /embed/product/:id` and `POST /embed/all` endpoints to FastAPI with internal API key auth. Call `POST /embed/product/:id` from Express backend whenever a product is created or updated.

---

#### STEP 029 — Frontend Performance Polish
**Phase:** F-10  
**Track:** Frontend  
**Depends on:** All frontend phases  
**Time estimate:** 3–4 hours  
**What to do:** Add React.lazy + Suspense for all page components. Add `useMemo` for filter computations. Ensure all product images use `loading="lazy"`. Add skeleton loaders everywhere a spinner currently shows. Add error boundary component to prevent white screen on errors. Verify mobile responsiveness on all pages.

---

#### STEP 030 — End-to-End Integration Testing
**Track:** All  
**Depends on:** All phases  
**Time estimate:** 3–4 hours  
**What to do:** Manual test of full user journeys:

**Journey 1 — New User:**
1. Land on home page → see banners, featured products, categories
2. Click "Face Care" → see filtered products
3. Apply price filter → products narrow
4. Click product → see detail page + similar products
5. Sign up → account created
6. Add to cart → cart shows in drawer
7. Checkout → order placed
8. Check order history → order appears

**Journey 2 — Returning User:**
1. Login → recommendations on home page personalized
2. Open chatbot → type "I need something for dry skin"
3. Bot recommends products → click product in chat → goes to detail page
4. Use voice input → works same as typing

**Journey 3 — Filter Stress Test:**
1. Apply 5 filters simultaneously → products update correctly
2. Copy URL → paste in new tab → same results
3. Use browser back/forward → filters preserved

---

## TOTAL PHASE REFERENCE TABLE

| Step | Phase ID | Track | Description | Depends On |
|------|----------|-------|-------------|------------|
| 001 | B-01 | Backend | Server + DB setup | — |
| 002 | B-02 | Backend | All MongoDB schemas | 001 |
| 003 | B-04 (seed) | Backend | Seed 30 products | 002 |
| 004 | B-03 | Backend | Auth routes | 002 |
| 005 | B-04 | Backend | Product API + filters | 003 |
| 006 | F-01 | Frontend | React project setup | — |
| 007 | F-02 | Frontend | Navbar + Footer + Layout | 006 |
| 008 | F-07 (card) | Frontend | ProductCard component | 006 |
| 009 | F-04 | Frontend | Products listing + filters | 005, 007, 008 |
| 010 | F-03 | Frontend | Home page | 005, 008 |
| 011 | F-05 | Frontend | Auth: login/signup | 004, 006 |
| 012 | F-06 | Frontend | Cart drawer + logic | 011, B-05 |
| 013 | A-01 | AI | FastAPI setup | 003 |
| 014 | A-02+A-03 | AI | Embeddings generation | 013 |
| 015 | A-03 | AI | Vector search + rec endpoints | 014 |
| 016 | A-04 | AI | Chatbot service | 015 |
| 017 | B-08 | Backend | AI proxy routes in Express | 016, 004 |
| 018 | F-09 (recs) | Frontend | Recommendations in UI | 017 |
| 019 | F-09 (chat) | Frontend | Chatbot widget + voice | 017 |
| 020 | B-05 | Backend | Cart + Order routes | 002, 004 |
| 021 | F-08 | Frontend | Checkout + Order history | 020, 011 |
| 022 | B-06 | Backend | Reviews backend | 002, 020 |
| 023 | F-07+F-10 | Frontend | ProductDetail + reviews UI | 022, 011 |
| 024 | B-07 | Backend | Image upload + static | 001 |
| 025 | Backend | Backend | Banners route wired | 024 |
| 026 | F-10 | Frontend | User profile page | 011 |
| 027 | B-09 | Backend | Security hardening | all backend |
| 028 | A-05 | AI | Embedding admin route | 014 |
| 029 | F-10 | Frontend | Performance polish | all frontend |
| 030 | All | All | E2E integration testing | everything |

---

## FOLDER STRUCTURE (COMPLETE)

```
project-root/
├── frontend/           ← React app
├── backend/            ← Express API
├── ai-service/         ← FastAPI AI service
└── README.md           ← This file
```

### Run Commands (open 3 terminals):
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — AI Service
cd ai-service && uvicorn main:app --port 8000 --reload

# Terminal 3 — Frontend
cd frontend && npm run dev
```

---

## SUGGESTIONS FOR HLD (High-Level Design) — FOR INTERVIEWS

### Component Diagram you should draw:
```
Client Browser
  └── React SPA
        ├── React Router (client-side routing)
        ├── Redux Toolkit (global state: auth, cart, filters)
        └── Axios (HTTP client with interceptors)

Express Server (API Gateway)
  ├── Auth Middleware (JWT verification)
  ├── REST Routes (/api/*)
  ├── Mongoose ORM → MongoDB
  └── HTTP Proxy → FastAPI

FastAPI (AI Microservice)
  ├── Sentence Transformer (in-process model)
  ├── Vector Similarity (numpy cosine)
  └── Session Store (in-memory dict)

MongoDB (Single DB, 6 Collections)
  ├── users
  ├── products (+ embedding vectors)
  ├── orders
  ├── reviews
  ├── carts
  └── banners
```

### LLD Suggestions:
1. **Product schema**: Use `slug` field for SEO-friendly URLs (`/products/himalaya-moisturizing-cream`)
2. **Order items**: Snapshot price at order time (never recalculate from live product price — it changes)
3. **Rating system**: Aggregate in MongoDB post-review-save, don't query on the fly
4. **Pagination**: Always use `skip/limit` with a total count query — send `totalPages` to frontend
5. **Cart merge**: On login, merge guest localStorage cart with server cart (prefer higher qty)
6. **Chatbot sessions**: UUID per chat session stored in localStorage, sent with each message
7. **Vector storage**: Store 384 floats directly in product document — avoids a join on retrieval

---

## RECRUITER-FOCUSED FEATURES CHECKLIST

These are features that stand out in job interviews and portfolio reviews:

- [x] JWT auth with refresh-token-ready architecture
- [x] URL-persisted filter state (shareable, bookmarkable)
- [x] Optimistic UI updates (cart updates before server confirms)
- [x] AI-powered semantic search (not just keyword)
- [x] Voice input (Web Speech API)
- [x] Vector embeddings stored in same DB as data
- [x] RAG-style chatbot (retrieval + generation)
- [x] Price snapshot in orders (real-world e-commerce requirement)
- [x] Purchase-gated reviews (prevents fake reviews)
- [x] Skeleton loaders (not just spinners)
- [x] Code-split React app (lazy loading pages)
- [x] Rate limiting on auth routes
- [x] Admin vs user role separation
- [x] Microservice architecture (Express + FastAPI separated)
- [x] Environment-based configuration (.env files)

---

## COMMON MISTAKES TO AVOID

1. **Never trust client-sent prices** — always calculate order total from MongoDB product prices
2. **Never store plain passwords** — always bcrypt.hash() before save
3. **Never return passwords in API responses** — add `.select('-password')` to all User queries
4. **Never put filter state only in React state** — it disappears on refresh; use URL params
5. **Never hardcode product data in JSX** — always fetch from API
6. **Never skip the auth middleware on protected routes** — test every protected endpoint without a token
7. **Never generate embeddings in the request cycle** — pre-generate and store; only embed queries at runtime
8. **Never use `*` as CORS origin in production** — always set exact client URL
9. **Never store API keys in frontend code** — .env + Vite VITE_ prefix only, and only for public values
10. **Always validate page and limit params** — cap limit at 50 to prevent scraping
