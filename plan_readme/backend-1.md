# BACKEND PLAN — Beauty & Care Shopping Website
## Stack: Node.js, Express.js, MongoDB (Mongoose), JWT, Multer, bcrypt

---

## ARCHITECTURE OVERVIEW

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── env.js              # Environment variable validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   ├── Cart.js
│   │   └── Banner.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── order.routes.js
│   │   ├── cart.routes.js
│   │   ├── review.routes.js
│   │   ├── banner.routes.js
│   │   ├── recommendation.routes.js
│   │   └── chat.routes.js
│   ├── controllers/            # One controller per route file
│   ├── middlewares/
│   │   ├── auth.middleware.js  # verifyToken, optionalAuth
│   │   ├── error.middleware.js # Global error handler
│   │   ├── validate.middleware.js # Joi/Zod validation
│   │   └── upload.middleware.js   # Multer config
│   ├── services/
│   │   ├── token.service.js    # JWT sign/verify
│   │   ├── email.service.js    # (optional) nodemailer
│   │   └── ai.service.js       # HTTP calls to Python AI backend
│   └── utils/
│       ├── apiResponse.js      # Standardized response shape
│       ├── asyncHandler.js     # try/catch wrapper for controllers
│       └── pagination.js       # Reusable pagination builder
├── uploads/                    # Local image storage (dev)
├── scripts/
│   └── seed.js                 # Seed 30 products + banners
├── .env
├── .env.example
└── server.js
```

---

## STANDARDIZED API RESPONSE (use everywhere):

```js
// utils/apiResponse.js
exports.success = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

exports.error = (res, message = 'Error', statusCode = 500, errors = null) =>
  res.status(statusCode).json({ success: false, message, errors });
```

---

## PHASE B-01: Server Setup, MongoDB, Environment
**Goal:** Express server running with DB connected, structured error handling.
**Depends on:** Nothing.

### Steps:
1. `npm init -y` in `/backend`
2. Install:
   ```
   npm install express mongoose dotenv cors helmet morgan bcryptjs jsonwebtoken
   npm install express-validator multer
   npm install -D nodemon
   ```
3. `server.js`:
   ```js
   app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
   app.use(helmet());
   app.use(morgan('dev'));
   app.use(express.json());
   app.use('/api', router); // all routes under /api
   app.use(errorMiddleware); // must be last
   ```
4. `config/db.js` — `mongoose.connect(process.env.MONGO_URI)` with event listeners for connected/error
5. `middlewares/error.middleware.js`:
   ```js
   module.exports = (err, req, res, next) => {
     const status = err.statusCode || 500;
     res.status(status).json({ success: false, message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
   };
   ```
6. `utils/asyncHandler.js`:
   ```js
   module.exports = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
   ```
7. Health check: `GET /api/health` returns `{ status: 'ok', timestamp }`
8. `.env`:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/beautystore
   JWT_SECRET=your_secret_here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   AI_SERVICE_URL=http://localhost:8000
   ```

### End Goal:
Server runs on port 5000, connects to MongoDB, all requests logged, errors returned in consistent JSON format.

---

## PHASE B-02: MongoDB Schemas
**Goal:** All data models defined with proper validation, indexes, and relationships.
**Depends on:** B-01

### User Schema:
```js
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone: String,
  addresses: [{ label, street, city, state, pincode, isDefault: Boolean }],
  profileImage: String,
  role: { type: String, enum: ['user','admin'], default: 'user' },
  purchasedProducts: [{ type: ObjectId, ref: 'Product' }], // for review gate
  createdAt: Date
}
// Pre-save: hash password with bcrypt (saltRounds=10)
// Method: comparePassword(candidatePassword)
// Index: email (unique)
```

### Product Schema:
```js
{
  name: { type: String, required: true },
  slug: { type: String, unique: true }, // url-friendly auto-generated from name
  brand: String,
  category: { type: String, enum: ['face-care','body-care','hair-care'], required: true },
  price: { type: Number, required: true },
  originalPrice: Number,    // for showing discount
  discount: Number,         // percentage
  images: [String],         // array of image URLs
  description: String,
  details: {                // key attributes for product page
    skinType: [String],     // ['oily','dry','combination']
    ingredients: [String],
    benefits: [String],
    weight: String,
    howToUse: String
  },
  tags: [String],           // for search and AI
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  deal: { type: Boolean, default: false },
  embedding: [Number],      // vector embedding from AI phase (stored here or in separate collection)
  createdAt: { type: Date, default: Date.now }
}
// Indexes: category, price, rating, featured, deal, text index on name+description+tags
```

### Order Schema:
```js
{
  user: { type: ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: ObjectId, ref: 'Product' },
    name: String,     // snapshot at time of purchase
    price: Number,    // snapshot
    image: String,
    qty: Number
  }],
  deliveryAddress: { name, phone, street, city, state, pincode },
  subtotal: Number,
  deliveryCharge: Number,
  total: Number,
  status: { type: String, enum: ['pending','processing','shipped','delivered','cancelled'], default: 'pending' },
  paymentMethod: String,
  paymentStatus: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  orderedAt: { type: Date, default: Date.now }
}
// Index: user (for fast history lookup)
```

### Review Schema:
```js
{
  product: { type: ObjectId, ref: 'Product', required: true },
  user: { type: ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: String,
  body: String,
  createdAt: { type: Date, default: Date.now }
}
// Compound unique index: { product, user } — one review per user per product
// Post-save hook: recalculate Product.rating and Product.reviewCount
```

### Cart Schema:
```js
{
  user: { type: ObjectId, ref: 'User', unique: true },
  items: [{ product: ObjectId, qty: Number }],
  updatedAt: Date
}
```

### Banner Schema:
```js
{
  image: String,
  title: String,
  subtitle: String,
  link: String,         // where clicking banner goes
  order: Number,        // display order
  active: { type: Boolean, default: true }
}
```

### End Goal:
All schemas defined with proper validation, indexes, and cross-collection relationships. Ready for seeding.

---

## PHASE B-03: Auth Routes — Register, Login, Me
**Goal:** Working JWT authentication with secure password handling.
**Depends on:** B-01, B-02

### Routes:
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me        (protected)
PUT  /api/auth/me        (protected) — update profile
PUT  /api/auth/password  (protected) — change password
```

### Register Logic:
1. Validate: name, email, password (use express-validator)
2. Check if email already exists → 409 Conflict
3. Hash password (bcrypt, 10 rounds)
4. Save user
5. Generate JWT: `jwt.sign({ userId: user._id, role: user.role }, secret, { expiresIn: '7d' })`
6. Return: `{ user: { id, name, email, role }, token }`

### Login Logic:
1. Find user by email
2. `user.comparePassword(req.body.password)`
3. If fail → 401 Unauthorized (same message for both wrong email and wrong password — don't leak which)
4. Generate JWT → return same shape as register

### Auth Middleware:
```js
// middlewares/auth.middleware.js
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next({ statusCode: 401, message: 'No token provided' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded; // { userId, role }
  next();
};

exports.optionalAuth = (req, res, next) => {
  // Same as verifyToken but doesn't fail on missing token
  // Used for routes where auth enhances response but isn't required
};
```

### End Goal:
Register and login return JWT. All protected routes work with Bearer token. Token decodes to userId used in subsequent requests.

---

## PHASE B-04: Product Routes — CRUD, Search, Filter, Pagination
**Goal:** Full product API with filtering, sorting, pagination, and text search.
**Depends on:** B-01, B-02

### Routes:
```
GET    /api/products              — list with filters
GET    /api/products/:id          — single product
POST   /api/products              — admin: create
PUT    /api/products/:id          — admin: update
DELETE /api/products/:id          — admin: delete
GET    /api/products/category/:cat — by category
```

### GET /api/products — Query Builder:
This is the most important endpoint. Handle all these params:
```
?category=face-care
&priceMin=200&priceMax=1000
&rating=4           (gte 4 stars)
&sort=price-asc     (or price-desc, rating-desc, newest, relevance)
&search=moisturizer (text search)
&featured=true
&deal=true
&page=1&limit=12
```

### Implementation:
```js
const buildProductQuery = (queryParams) => {
  const filter = {};
  if (queryParams.category) filter.category = queryParams.category;
  if (queryParams.priceMin || queryParams.priceMax) {
    filter.price = {};
    if (queryParams.priceMin) filter.price.$gte = Number(queryParams.priceMin);
    if (queryParams.priceMax) filter.price.$lte = Number(queryParams.priceMax);
  }
  if (queryParams.rating) filter.rating = { $gte: Number(queryParams.rating) };
  if (queryParams.featured) filter.featured = true;
  if (queryParams.deal) filter.deal = true;
  if (queryParams.search) filter.$text = { $search: queryParams.search };
  return filter;
};

const buildSort = (sortParam) => {
  const sorts = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'rating-desc': { rating: -1 },
    'newest': { createdAt: -1 },
    'relevance': { score: { $meta: 'textScore' } }
  };
  return sorts[sortParam] || { createdAt: -1 };
};
```

### Pagination Response Shape:
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "total": 30,
      "page": 1,
      "limit": 12,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Product Seeding Script (`scripts/seed.js`):
- Run with: `node scripts/seed.js`
- Creates 30 products (10 per category) with realistic names, prices, descriptions, tags
- Creates 3 banners
- Creates 1 admin user

### End Goal:
Frontend can fetch products with any combination of filters. Text search works. Pagination works. Response always has same shape.

---

## PHASE B-05: Cart & Order Routes
**Goal:** Server-side cart management and order creation/retrieval.
**Depends on:** B-02, B-03

### Cart Routes:
```
GET    /api/cart         — get user's cart (populated with product details)
PUT    /api/cart         — sync full cart (replace server cart with client cart)
POST   /api/cart/add     — add one item
DELETE /api/cart/:productId — remove item
POST   /api/cart/merge   — merge guest cart into server cart on login
```

### Order Routes:
```
POST   /api/orders               — create order from current cart
GET    /api/orders               — user's order history
GET    /api/orders/:id           — single order detail
PUT    /api/orders/:id/cancel    — user cancels pending order
PUT    /api/orders/:id/status    — admin updates status
```

### Create Order Logic:
1. Get user's cart (populated with latest product prices and stock)
2. Validate each item is in stock → return error with which items are unavailable
3. Calculate subtotal (use DB prices, NOT client-sent prices — security critical)
4. Create Order document
5. Deduct stock from each Product
6. Add product IDs to `user.purchasedProducts` (for review gate)
7. Clear user's Cart
8. Return created order

### End Goal:
Orders created securely (prices from DB never from client). Cart syncs between devices. Order history returns populated data.

---

## PHASE B-06: Reviews Route
**Goal:** Product review submission with verification gate.
**Depends on:** B-02, B-03, B-05

### Routes:
```
GET    /api/products/:id/reviews     — get reviews (paginated)
POST   /api/products/:id/reviews     — submit review (auth required)
DELETE /api/reviews/:id              — delete own review
```

### POST review validation:
1. Auth required (verifyToken)
2. Check user has not already reviewed this product (unique index will catch it, but give nice error)
3. Check `user.purchasedProducts.includes(productId)` — only buyers can review
4. Create review
5. Post-save hook auto-updates `Product.rating` and `Product.reviewCount`:
```js
ReviewSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const stats = await Review.aggregate([
    { $match: { product: this.product } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  await Product.findByIdAndUpdate(this.product, {
    rating: stats[0]?.avgRating.toFixed(1) || 0,
    reviewCount: stats[0]?.count || 0
  });
});
```

### End Goal:
Only verified purchasers can review. Product rating auto-updates. Reviews are paginated and returned with user name.

---

## PHASE B-07: Image Upload & Static Serving
**Goal:** Product and profile images uploadable and servable.
**Depends on:** B-01

### Multer Config:
```js
// middlewares/upload.middleware.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const fileFilter = (req, file, cb) =>
  ['image/jpeg','image/png','image/webp'].includes(file.mimetype)
    ? cb(null, true) : cb(new Error('Only JPEG/PNG/WebP allowed'));

exports.upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
```

### Routes:
```
POST /api/upload/product-image   (admin only) → returns { url: '/uploads/filename.jpg' }
POST /api/upload/profile-image   (auth required)
```

### Static serving:
```js
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

### End Goal:
Images uploadable via multipart form. Accessible at `http://localhost:5000/uploads/filename.jpg`.

---

## PHASE B-08: Recommendation Proxy & Chat Proxy Routes
**Goal:** Backend acts as a secure proxy to the Python AI service.
**Depends on:** B-03, AI Phase A-02

### Why a proxy (not direct from frontend):
- Keeps AI_SERVICE_URL secret
- Backend can enrich requests with user data from MongoDB before forwarding
- Backend validates auth before proxying

### Routes:
```
GET  /api/recommendations/homepage      — personalized or popular (optional auth)
GET  /api/recommendations/similar/:id   — products similar to given product
POST /api/chat/message                  — send chat message to AI, return reply
```

### Recommendation Proxy:
```js
exports.getHomepageRecs = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || null;
  let purchasedIds = [];
  if (userId) {
    const user = await User.findById(userId).select('purchasedProducts');
    purchasedIds = user.purchasedProducts;
  }
  const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/recommend/homepage`, {
    userId, purchasedIds
  });
  // Fetch full product details for recommended product IDs
  const productIds = aiRes.data.productIds;
  const products = await Product.find({ _id: { $in: productIds } });
  return success(res, products);
});
```

### Chat Proxy:
```js
exports.sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user?.userId || null;
  const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/chat`, {
    message, sessionId, userId
  });
  return success(res, aiRes.data);
});
```

### End Goal:
Frontend only talks to Express. AI service URL never exposed. User context enriched before forwarding to AI.

---

## PHASE B-09: Security Hardening & Rate Limiting
**Goal:** Production-level security measures applied throughout.
**Depends on:** B-01 through B-08

### Steps:
1. Rate limiting:
   ```
   npm install express-rate-limit
   ```
   - Global: 100 requests per 15 minutes per IP
   - Auth routes (login/register): 10 requests per 15 minutes per IP (stricter)
2. Input sanitization:
   - All user inputs trimmed and validated via express-validator on every route
   - MongoDB injection protection: mongoose does this by default with typed schemas
3. Security headers: `helmet()` already installed in B-01 — ensure it's applied
4. CORS: verify CLIENT_URL is set to exact frontend origin, not `*`
5. Don't return passwords ever: add `.select('-password')` on every User query
6. Admin routes: check `req.user.role === 'admin'` middleware on all admin endpoints
7. Add `X-Content-Type-Options`, `X-Frame-Options` via helmet defaults

### End Goal:
API is hardened against common attacks. Auth routes are rate-limited. No sensitive data leaks in responses.

---

## HIGH-LEVEL DESIGN NOTES (Backend)

### Folder Convention:
- Controller function names: `getProducts`, `getProductById`, `createProduct`, etc.
- All controllers wrapped with `asyncHandler` — no try/catch in controllers
- All responses via `apiResponse.success()` or `apiResponse.error()`

### Environment Validation (startup):
```js
// config/env.js
const required = ['MONGO_URI','JWT_SECRET','CLIENT_URL'];
required.forEach(k => { if (!process.env[k]) throw new Error(`Missing env var: ${k}`); });
```

### Scalability Notes:
- Text search index on Product: `{ name: 'text', description: 'text', tags: 'text' }` — weights: name=10, tags=5, description=1
- Future: Redis for session/cart caching
- Future: S3 for image storage instead of local disk

### Admin Seeded Credentials (for dev):
```
email: admin@beautystore.com
password: Admin@1234
```
