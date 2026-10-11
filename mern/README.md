# MERN Template

Express + MongoDB API (`backend/`) and React + Vite + Tailwind + GSAP client (`client/`),
with JWT auth (signup, login, protected routes, roles), a storefront and a store admin.

## Quick start

```bash
npm run install:all                         # installs root, backend and client
cp backend/.env.example backend/.env        # fill in MONGO_URI and JWT_SECRET
cp client/.env.example client/.env
npm run dev                                 # API on :5000, client on :5173
```

In development the client calls `/api/...` and Vite proxies it to the backend,
so no CORS setup is needed locally.

## Pages

| URL                    | Who       | What                                            |
| ---------------------- | --------- | ----------------------------------------------- |
| `/`                    | everyone  | home: new arrivals and categories               |
| `/shop`                | everyone  | catalogue with search, category filter and sort |
| `/products/:slug`      | everyone  | product page with size/colour picker            |
| `/collections`         | everyone  | all collections                                 |
| `/about`               | everyone  | about the store                                 |
| `/cart`                | everyone  | cart, checked against live prices and stock     |
| `/checkout`            | everyone  | guest checkout (account optional)               |
| `/orders/:number?key=` | customer  | order status, bank details, payment form        |
| `/login`, `/signup`    | customers | customer sign-in                                |
| `/account`             | customers | their details and orders placed while signed in |
| `/terms`, `/privacy`   | everyone  | Terms and Conditions, Privacy Policy            |
| `/admin/login`         | admin     | store owner sign-in (admin accounts only)       |
| `/admin/orders`        | admin     | orders: check payments, ship, deliver, cancel   |
| `/admin/products`      | admin     | products: add, edit, photos, delete             |
| `/admin/categories`    | admin     | categories                                      |
| `/admin/customers`     | admin     | everyone who ordered, with their order history  |
| `/admin/discounts`     | admin     | discount codes                                  |
| `/admin/settings`      | admin     | bank accounts, shipping fee, hours to pay       |

## Store admin

The owner account comes from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`.
Every time the server starts it creates that account, or resets it to that password
and the admin role, so changing the password is: edit `.env`, restart.
Then sign in at `/admin/login`.

Checkout stays closed until at least one bank account is saved in `/admin/settings`.

## How an order works

1. The customer places the order. The items' stock is reserved straight away, so
   nobody else can buy the same last item.
2. They see the bank details and transfer the total, then send the transaction
   reference (and a screenshot once uploads are set up). Status: payment being checked.
3. In `/admin/orders` you confirm the payment once it is in your account, or
   reject it with a reason (the customer sees it and gets a new deadline). Then
   mark it shipped (optional courier and tracking number) and delivered.
   Cancelling an order before it ships puts its stock back on sale.
4. Orders not paid within the "hours to pay" setting are cancelled automatically
   (checked every 10 minutes) and their stock goes back on sale.

Discount codes are a percentage or a fixed amount off the subtotal, with an
optional minimum spend, expiry date and usage limit. Each order using a code
takes one use; a cancelled or expired order gives it back. Free shipping is
judged on the subtotal after the discount.

Guests reach their order through a private link (`/orders/1001?key=...`). Only a
hash of the key is stored, and a wrong key looks the same as a wrong order number.

Product photos need the `CLOUDINARY_*` keys in `backend/.env` (free account, see
[backend/README.md](backend/README.md)). Without them everything else works and
uploads say they are not set up yet.

## Scripts (run from the root)

| Script                          | What it does                                                           |
| ------------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                   | backend + client together                                              |
| `npm run dev:backend`           | backend only (nodemon)                                                 |
| `npm run dev:client`            | client only (Vite)                                                     |
| `npm run build`                 | production build of the client                                         |
| `npm start`                     | start the backend without nodemon                                      |
| `npm test`                      | backend tests (in-memory MongoDB, never yours)                         |
| `npm run lint`                  | ESLint on backend and client                                           |
| `npm run format`                | format everything with Prettier                                        |
| `npm run make-admin -- <email>` | promote a user to admin                                                |
| `npm run seed:demo`             | add 16 demo products to preview the store (`-- --remove` deletes them) |

## Stack

| Area    | Libraries                                                               |
| ------- | ----------------------------------------------------------------------- |
| API     | Express 5, Mongoose, bcryptjs, jsonwebtoken, zod, helmet, rate limiting |
| Client  | React 19, React Router, TanStack Query, react-hook-form + zod, sonner   |
| UI      | Tailwind CSS v4, GSAP                                                   |
| Quality | Vitest + Supertest, ESLint, Prettier                                    |

## Conventions

Code is split by feature: every layer gets a folder per feature (`auth`, `products`, `orders`, ...).

```
backend/src/
  controllers/<feature>/   routes/<feature>/   validators/<feature>/   middleware/<feature>/
backend/tests/<feature>/

client/src/
  pages/<feature>/         components/<feature>/   hooks/<feature>/
  services/<feature>/      validators/<feature>/   context/<feature>/
  components/common/       shared UI (loader, ...)
  services/api.js          fetch wrapper: base URL, JWT header, errors
  lib/queryClient.js       TanStack Query defaults
```

### Adding a feature (e.g. products)

Backend: see [backend/README.md](backend/README.md#adding-a-new-feature-eg-products).

Client:

1. `services/products/product.service.js` - API calls using `request()` from `services/api.js`
2. `hooks/products/useProducts.js` - `useQuery` / `useMutation` around the service
3. `components/products/` and `pages/products/ProductsPage.jsx` - the UI
4. `App.jsx` - add a lazy route, inside `<ProtectedRoute />` if it needs login

## Auth flow

The JWT is stored in an **httpOnly cookie**, so page JavaScript (and any
injected script) can never read it.

1. Signup/login: the API sets the `access_token` cookie (`HttpOnly`, `SameSite=Lax`,
   `Secure` in production). The token is never in the response body.
2. `services/api.js` sends `credentials: 'include'`, so the browser attaches the cookie.
3. On page load `AuthProvider` asks `GET /api/auth/session` who is signed in. Guests get
   `data: null` rather than a 401, so the browser console stays clean.
4. Logout calls `POST /api/auth/logout`, which clears the cookie.
5. Any 401 on a protected request logs the user out with a toast.
6. Logging in or out in one tab updates every open tab (BroadcastChannel).

CSRF: state-changing requests must send `X-Requested-With`, which other sites
can't add without passing CORS. `services/api.js` does this for you.

## Production notes

- Build the client with `VITE_API_URL` set to the deployed API, e.g. `https://api.example.com/api`.
- Set `CLIENT_URL` on the backend to the deployed client URL (CORS).
- Serve the API over HTTPS; the cookie is `Secure` when `NODE_ENV=production`.
- Easiest: client and API on the same site (`app.example.com` + `api.example.com`,
  or one domain with `/api` proxied), which works with the default `COOKIE_SAMESITE=lax`.
  Only if they are on different sites, set `COOKIE_SAMESITE=none`.
- Set `TRUST_PROXY=1` when the backend runs behind a reverse proxy.
