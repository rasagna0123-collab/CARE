# FRONTEND PLAN — Beauty & Care Shopping Website
## Stack: React.js, React Router, Redux Toolkit, Axios, TailwindCSS

---

## ARCHITECTURE OVERVIEW

```
src/
├── assets/                  # Static images, icons, fonts
├── components/
│   ├── common/              # Reusable: Button, Input, Modal, Spinner, Toast
│   ├── layout/              # Navbar, Footer, Sidebar
│   ├── product/             # ProductCard, ProductGrid, ProductDetail
│   ├── filters/             # FilterPanel, FilterChip, PriceSlider
│   ├── cart/                # CartDrawer, CartItem, CartSummary
│   ├── auth/                # LoginForm, SignupForm, AuthModal
│   ├── home/                # Banner, HeroSection, CategoryRow, DealsRow
│   ├── recommendation/      # RecommendationCarousel, AIBadge
│   └── chatbot/             # ChatWindow, MessageBubble, VoiceButton
├── pages/
│   ├── Home.jsx
│   ├── Products.jsx          # Listings with filters
│   ├── ProductDetail.jsx
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   ├── OrderHistory.jsx
│   ├── Profile.jsx
│   ├── Login.jsx
│   └── Signup.jsx
├── store/                   # Redux slices
│   ├── authSlice.js
│   ├── cartSlice.js
│   ├── productSlice.js
│   ├── filterSlice.js
│   └── orderSlice.js
├── hooks/                   # useAuth, useCart, useFilters, useDebounce
├── services/                # API call functions (Axios wrappers)
│   ├── api.js               # Axios instance with interceptors
│   ├── authService.js
│   ├── productService.js
│   ├── orderService.js
│   └── chatService.js
├── utils/                   # formatPrice, formatDate, validators
├── constants/               # CATEGORIES, SORT_OPTIONS, FILTER_CONFIG
└── App.jsx + main.jsx
```

---

## PHASE F-01: Project Scaffolding & Base Setup
**Goal:** A running React app with routing, global state, and API connection ready.
**Depends on:** Nothing (first phase)

### Steps:
1. `npm create vite@latest frontend -- --template react`
2. Install dependencies:
   ```
   npm install react-router-dom @reduxjs/toolkit react-redux axios
   npm install tailwindcss postcss autoprefixer
   npm install react-hot-toast react-icons
   npx tailwindcss init -p
   ```
3. Configure `tailwind.config.js` — add `./src/**/*.{js,jsx}` to content array.
4. Set up `src/store/store.js` with Redux store combining all slices (empty slices for now).
5. Wrap `App.jsx` with `<Provider store={store}>` and `<BrowserRouter>`.
6. Create `src/services/api.js`:
   - Axios instance with `baseURL` from `.env` (`VITE_API_URL=http://localhost:5000/api`)
   - Request interceptor: attach `Authorization: Bearer <token>` from localStorage if present
   - Response interceptor: on 401, clear token and redirect to `/login`
7. Set up basic routes in `App.jsx` using React Router v6.
8. Create placeholder page components for all 9 pages.
9. Create `.env.example` with `VITE_API_URL`.

### End Goal:
App boots, routes work, Redux store initialized, Axios pre-configured with auth headers, TailwindCSS active.

---

## PHASE F-02: Layout — Navbar, Footer, Sidebar
**Goal:** Persistent navigation that responds to auth state, with working links.
**Depends on:** F-01, F-05 (auth slice — can mock for now)

### Navbar must have:
- Logo (left)
- Search bar (center) — with debounce, submits to `/products?search=`
- Cart icon with live item count badge (from Redux cartSlice)
- User dropdown: if logged in → Profile, Order History, Logout; if not → Login/Signup
- Category nav links: Face Care | Body Care | Hair Care

### Implementation:
1. `Navbar.jsx` — reads `user` from `authSlice`, `itemCount` from `cartSlice`
2. `useDebounce(value, 300)` hook for search bar — on debounce fire, navigate to `/products?search=query`
3. Cart badge: `useSelector(state => state.cart.items.reduce((a,i) => a + i.qty, 0))`
4. Dropdown with `useState(isOpen)` + `useEffect` to close on outside click
5. `Footer.jsx` — links, socials, copyright
6. `Layout.jsx` — wraps `<Navbar/><main>{children}</main><Footer/>` — used by all pages via React Router's `<Outlet/>`

### End Goal:
Full persistent layout. User sees their cart count and auth state everywhere. Search navigates correctly.

---

## PHASE F-03: Home Page — Banners, Categories, Featured Products
**Goal:** Dynamic, data-driven homepage like Amazon. No hardcoded content.
**Depends on:** F-01, F-02, F-07 (ProductCard component)

### Sections:
1. **Hero Banner Carousel** — fetches from `GET /api/banners` → auto-rotates every 4s, has prev/next arrows, dot indicators
2. **Category Shortcuts** — 3 cards: Face Care, Body Care, Hair Care → each links to `/products?category=face-care`
3. **Featured Products Row** — fetches `GET /api/products?featured=true&limit=8` → horizontal scroll with arrow buttons
4. **Deals of the Day** — fetches `GET /api/products?deal=true&limit=6`
5. **AI-Recommended for You** — fetches `GET /api/recommendations/homepage` (uses user token if logged in) → shows recommendation carousel

### Implementation Notes:
- Each section is its own component, makes its own API call via `useEffect`
- Use `useState({ loading, data, error })` pattern in each section
- Skeleton loaders while fetching (gray animated boxes matching card shape)
- `ProductCard` component used in all product rows — must be reusable (Phase F-07)
- Banner carousel: pure CSS transitions, no library needed

### End Goal:
Homepage is fully dynamic. Every section loads data from backend. Carousel animates. Recommendations show for logged-in users.

---

## PHASE F-04: Product Listing Page with Filters
**Goal:** Dynamic product grid that updates instantly when filters change — the core of the shopping experience.
**Depends on:** F-01, F-02, F-07

### URL-First Design (CRITICAL):
All filter state lives in URL query params, NOT just React state. This means:
- Shareable URLs
- Browser back/forward works
- Page refresh preserves filters

```
/products?category=face-care&priceMin=200&priceMax=1000&rating=4&sort=price-asc&search=moisturizer&page=1
```

### Filter Options (from constants):
- Category: face-care | body-care | hair-care (from URL path or query)
- Price Range: slider with min/max (0 to 2000)
- Rating: 1★ and above to 4★ and above
- Sort: Relevance | Price: Low to High | Price: High to Low | Newest | Top Rated

### Implementation:
1. `filterSlice.js` — Redux slice storing `{ category, priceMin, priceMax, rating, sort, search, page }`
2. `useFilters()` hook:
   - On mount: reads URL params → sets Redux filter state
   - On filter change: updates URL params with `useNavigate` (replace, not push)
   - Returns `{ filters, setFilter, clearAll }`
3. `FilterPanel.jsx` (left sidebar desktop / drawer on mobile):
   - Each control is a controlled component reading from Redux
   - On change → dispatches to Redux → URL updates → products re-fetch
4. `Products.jsx` page:
   - `useEffect([filters])` → calls `GET /api/products?...filters` → updates product grid
   - Shows `FilterChip` bar at top showing active filters with X to remove each
   - Shows result count: "Showing 12 of 30 products"
5. Pagination: page numbers at bottom → updates `page` in URL and Redux

### End Goal:
Selecting any filter instantly updates URL and re-fetches products. Page refresh keeps filters. Back button restores previous filter state. Mobile has a "Filters" button opening a drawer.

---

## PHASE F-05: Authentication — Signup, Login, Logout
**Goal:** Full JWT-based auth flow with protected routes.
**Depends on:** F-01, F-02. Backend Phase B-02.

### authSlice.js:
```js
{ user: null, token: null, loading: false, error: null }
// Actions: setCredentials, logout, setLoading, setError
```

### Persistence:
- On `setCredentials`: save `token` to `localStorage` + update axios default header
- On app load (`App.jsx`): read token from localStorage → validate via `GET /api/auth/me` → populate Redux
- On `logout`: clear localStorage, clear Redux, redirect to `/`

### Forms:
- `LoginForm.jsx`: email + password, inline validation, shows error from Redux, submits → dispatches `loginThunk`
- `SignupForm.jsx`: name, email, password, confirm-password, client-side password match check
- Both forms: disable submit button while loading, show spinner in button
- After login → redirect to previous attempted page (from `location.state?.from`) or `/`

### Protected Routes:
```jsx
// ProtectedRoute.jsx
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector(s => s.auth);
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};
// Usage in App.jsx:
<Route path="/orders" element={<ProtectedRoute><OrderHistory/></ProtectedRoute>} />
```

### End Goal:
User can sign up, log in, stay logged in across refresh. Protected pages redirect to login. Token auto-attached to all API calls.

---

## PHASE F-06: Cart — Add, Update, Remove, Persist
**Goal:** Cart that works across page navigation, persists in localStorage, syncs with backend for logged-in users.
**Depends on:** F-05

### cartSlice.js:
```js
{ items: [], total: 0, synced: false }
// items: [{ productId, name, price, image, qty, stock }]
```

### Strategy:
- Guest: cart stored only in Redux + localStorage
- Logged in: on login, merge localStorage cart with server cart via `POST /api/cart/merge`
- On add/remove/update: update Redux immediately (optimistic), then `PUT /api/cart` to sync with server

### CartDrawer.jsx (slides from right):
- Opens on cart icon click
- Lists all cart items with qty controls (+/-) and remove button
- Shows subtotal
- "Proceed to Checkout" button → navigates to `/checkout`
- Empty state with "Start Shopping" link

### End Goal:
Cart persists on refresh. Adding from any ProductCard or ProductDetail works. Qty updates are instant. Logged-in users have cart synced to server.

---

## PHASE F-07: ProductCard & ProductDetail
**Goal:** Reusable product card + full detail page.
**Depends on:** F-01

### ProductCard.jsx (props: product, showBadge):
```
[ Image ]
[Badge: "AI Pick" / "Deal" / "Featured"]
Product Name (truncated 2 lines)
★★★★☆  (4.2)  (128 reviews)
₹ 499   ~~₹699~~  (28% off)
[Add to Cart] button
```
- Image: `<img loading="lazy">` for performance
- On card click → navigate to `/products/:id`
- "Add to Cart" → dispatches to cartSlice, shows toast "Added to cart!"
- Hover effect: slight elevation shadow

### ProductDetail.jsx:
Fetches `GET /api/products/:id`
Sections:
1. Image gallery (main image + thumbnails)
2. Name, brand, rating with review count
3. Price with discount display
4. Description (expandable)
5. Key Ingredients / Benefits (from product.details object)
6. Add to Cart with quantity selector
7. "Similar Products" section → fetches `GET /api/recommendations/similar/:id`
8. Reviews section → fetches `GET /api/products/:id/reviews`

### End Goal:
Product card used consistently across home, listing, recommendations. Detail page is content-rich and drives add-to-cart conversions.

---

## PHASE F-08: Order Flow — Checkout & Order History
**Goal:** Complete order placement and history viewing.
**Depends on:** F-05 (auth), F-06 (cart), Backend B-05

### Checkout.jsx:
Multi-step form (3 steps shown via stepper UI):
1. **Delivery Address**: name, phone, address, city, state, pincode — saved to user profile
2. **Order Review**: shows cart items, prices, delivery estimate
3. **Payment**: mock payment (show "Pay ₹ XXX" button → calls `POST /api/orders` → success page)

### OrderHistory.jsx:
Fetches `GET /api/orders` (auth required)
Shows list of past orders:
- Order ID, date, status (badge: Processing/Shipped/Delivered)
- Product thumbnails + names
- Total amount
- "View Details" → expands/modal with full order breakdown

### End Goal:
User can complete purchase end-to-end. Order saved to DB. History page shows all past orders with status.

---

## PHASE F-09: AI Chatbot & Voice Assistant UI
**Goal:** Floating chatbot + voice input that connects to Python AI backend.
**Depends on:** F-05 (for user context), AI Phase A-03

### ChatWidget.jsx (floating bottom-right):
- Chat bubble button → opens `ChatWindow.jsx`
- `ChatWindow`: header with title + close button, message list, input row
- Messages: user (right, blue) / bot (left, gray) with timestamps
- Typing indicator (animated dots) while waiting for response
- Suggested quick replies: "Show face care products", "Under ₹500", "Recommend for dry skin"

### Voice Input:
```js
// Uses Web Speech API (browser built-in — no library needed)
const recognition = new window.SpeechRecognition();
recognition.lang = 'en-IN';
recognition.onresult = (e) => setInput(e.results[0][0].transcript);
```
- Mic button in chat input → starts recording → auto-fills text input → auto-sends
- Visual: mic icon turns red while recording, pulse animation

### Chat API:
```js
POST /api/chat/message
Body: { message: "...", userId: "...", sessionId: "..." }
Response: { reply: "...", products: [...] }  // products optional
```
- If response contains `products` array → render ProductCard components inside chat

### End Goal:
Floating chatbot works on all pages. User can type or speak. Bot replies with text + optional product cards. Conversation context maintained via sessionId.

---

## PHASE F-10: Profile, Reviews, Performance Polish
**Goal:** User profile management, review submission, and production-ready performance.
**Depends on:** F-05, F-07, F-08

### Profile.jsx:
- Edit name, email, phone, profile picture (upload)
- Saved addresses list (add/edit/delete)
- Change password section

### Review Submission (in ProductDetail.jsx):
- Star rating selector (clickable stars)
- Text review textarea
- "Post Review" → `POST /api/products/:id/reviews`
- Only shown if user is logged in AND has purchased the product (check from orders)

### Performance:
1. React.lazy + Suspense for all pages (code splitting)
2. `useMemo` for filter computations, `useCallback` for handlers passed to lists
3. Virtualized list for products (react-window) if >20 items
4. Image lazy loading on all ProductCards (`loading="lazy"`)
5. `localStorage` cache: store last homepage data with 5-min expiry → skip API call if fresh

### End Goal:
Fully polished frontend. Profile editable. Reviews submittable. App loads fast. Perceived performance is excellent.

---

## HIGH-LEVEL DESIGN NOTES (Frontend)

### State Management Rules:
- **Server state** (products, orders, user data) → Axios calls + local component state or Redux async thunks
- **UI state** (modals, drawers, loaders) → local `useState`
- **Shared client state** (cart, auth, filters) → Redux

### API Error Handling Pattern (use everywhere):
```jsx
const [state, setState] = useState({ loading: false, data: null, error: null });
try {
  setState(s => ({...s, loading: true}));
  const { data } = await productService.getAll(filters);
  setState({ loading: false, data, error: null });
} catch(e) {
  setState({ loading: false, data: null, error: e.response?.data?.message || 'Something went wrong' });
}
```

### Mobile-First CSS:
- All layouts start mobile-first with Tailwind breakpoints (`md:`, `lg:`)
- Filter panel: sidebar on `lg:`, drawer (off-canvas) on mobile
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

### Environment Variables:
```
VITE_API_URL=http://localhost:5000/api
VITE_AI_API_URL=http://localhost:8000
```
