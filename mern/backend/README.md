# Backend (Express + MongoDB, MVC)

## Run

```bash
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD
npm run dev
```

Needs MongoDB. Either install it locally, or create a free Atlas
cluster and put its connection string in `.env` as `MONGO_URI`.
The server refuses to start if `MONGO_URI` or `JWT_SECRET` is missing.

Product photos are stored on Cloudinary: create a free account at
[cloudinary.com](https://cloudinary.com) and copy the cloud name, API key and
API secret from its dashboard into `.env`. Until then the API runs normally and
photo uploads answer 503 with a message saying so.

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Structure

Each feature gets its own folder inside every layer (`auth`, `products`, `orders`, ...).

```
server.js                     entry point: connects DB, starts server
scripts/makeAdmin.js          promote a user to admin
src/
  app.js                      express app, middleware, route mounting
  config/env.js               reads + validates every env var
  config/db.js                MongoDB connection
  models/                     Mongoose schemas (the M)
  controllers/<feature>/      request handlers / business logic (the C)
  routes/<feature>/           URL -> controller mapping
  validators/<feature>/       zod schemas for request bodies
  middleware/auth/            protect (JWT), authorize (roles), rate limit
  middleware/                 validate(schema), notFound, central errorHandler
  utils/ApiError.js           throw new ApiError(404, 'message')
tests/<feature>/              Vitest + Supertest, in-memory MongoDB
```

The "V" is the React app in `../client`: this API only returns JSON.

## Endpoints

| Method | URL                       | Access    | Action                     |
| ------ | ------------------------- | --------- | -------------------------- |
| GET    | /api/health               | public    | health check               |
| GET    | /sitemap.xml              | public    | pages for search engines   |
| GET    | /robots.txt               | public    | crawler rules + sitemap    |
| GET    | any other non-API path    | public    | storefront page (SEO tags) |
| POST   | /api/auth/signup          | public    | create account, set cookie |
| POST   | /api/auth/login           | public    | log in, set cookie         |
| POST   | /api/auth/admin/login     | public    | log in, admins only        |
| POST   | /api/auth/logout          | public    | clear cookie               |
| GET    | /api/auth/me              | logged in | current user + expiry      |
| GET    | /api/auth/session         | public    | current user or null       |
| POST   | /api/auth/forgot-password | public    | emails a reset link        |
| POST   | /api/auth/reset-password  | public    | sets a new password        |
| GET    | /api/users                | admin     | list users                 |
| GET    | /api/users/:id            | admin     | get one                    |
| POST   | /api/users                | admin     | create                     |
| PUT    | /api/users/:id            | admin     | update name, email, role   |
| DELETE | /api/users/:id            | admin     | delete (not yourself)      |

### Store

Public routes only ever return products with status `active`.

| Method | URL                                     | Access | Action                                         |
| ------ | --------------------------------------- | ------ | ---------------------------------------------- |
| GET    | /api/categories                         | public | list categories                                |
| GET    | /api/products                           | public | list, `?q=&category=<slug>&sort=&page=&limit=` |
| GET    | /api/products/:slug                     | public | one product                                    |
| POST   | /api/admin/categories                   | admin  | create category                                |
| PUT    | /api/admin/categories/:id               | admin  | rename / describe (slug stays)                 |
| DELETE | /api/admin/categories/:id               | admin  | delete (only if it has no products)            |
| POST   | /api/admin/categories/:id/image         | admin  | category photo (multipart `image`)             |
| DELETE | /api/admin/categories/:id/image         | admin  | remove the category photo                      |
| GET    | /api/admin/products                     | admin  | list all statuses, `?q=&status=&page=&limit=`  |
| GET    | /api/admin/products/:id                 | admin  | one product                                    |
| POST   | /api/admin/products                     | admin  | create with options and variants               |
| PUT    | /api/admin/products/:id                 | admin  | update, reorder images                         |
| DELETE | /api/admin/products/:id                 | admin  | delete product and its images                  |
| POST   | /api/admin/products/:id/images          | admin  | upload images (multipart field `images`)       |
| DELETE | /api/admin/products/:id/images/:imageId | admin  | remove one image                               |

| GET | /api/settings | public | bank details, shipping, checkout open? |
| PUT | /api/admin/settings | admin | save settings |
| POST | /api/admin/settings/hero-image | admin | home page photo (multipart `image`) |
| DELETE | /api/admin/settings/hero-image | admin | remove the home page photo |
| POST | /api/orders/quote | public | live prices, stock and totals for a cart |
| POST | /api/orders | public | place an order (10 per hour per IP) |
| GET | /api/orders/mine | logged in | orders placed while signed in |
| GET | /api/orders/:number?key= | key or owner | one order (no key needed for the signed-in owner) |
| POST | /api/orders/:number/payment?key= | key | send `reference` + `screenshot` (screenshot required once uploads are set up) |
| GET | /api/admin/orders | admin | list, `?q=&status=&page=&limit=` |
| GET | /api/admin/orders/:id | admin | one order |
| POST | /api/admin/orders/:id/actions | admin | `confirm_payment`, `reject_payment`, `ship`, `deliver`, `cancel` |
| GET | /api/admin/customers | admin | customers grouped by email, `?q=&page=&limit=` |
| GET | /api/admin/customers/:email | admin | one customer and their orders |
| GET | /api/admin/discounts | admin | list codes |
| POST | /api/admin/discounts | admin | create a code |
| PUT | /api/admin/discounts/:id | admin | update a code (use count is never set here) |
| DELETE | /api/admin/discounts/:id | admin | delete a code |

Every product has at least one variant, and each variant has its own price,
stock and optional SKU. A product with options (up to 3, e.g. Size and Colour)
has one variant per combination it sells. Send each variant's `_id` back when
editing so carts and orders keep pointing at it.

Browsers authenticate with the httpOnly `access_token` cookie set on login.
Non-browser clients (mobile, Postman) can send `Authorization: Bearer <token>`
instead, using the token from that cookie.

## Roles

Signup always creates a `user`. The store owner's admin account is created on
startup from `ADMIN_EMAIL` and `ADMIN_PASSWORD` (`src/utils/auth/seedAdmin.js`).
To make another existing user an admin:

```bash
npm run make-admin -- you@example.com
```

Guard a route with `router.use(protect, authorize('admin'))`.

## Security

- `helmet` security headers, JSON bodies capped at 100kb
- Login/signup rate limited: 10 failed attempts per 15 minutes per IP
- Every request body is validated with zod, which also blocks NoSQL injection
  like `{ "email": { "$gt": "" } }`
- Passwords hashed with bcrypt and never returned by the API
- JWT only in an httpOnly cookie (`SameSite=Lax`, `Secure` in production),
  so XSS can't steal it. Settings: `COOKIE_SAMESITE`, `COOKIE_SECURE`
- CSRF: cookie-authenticated `POST/PUT/PATCH/DELETE` requests must send an
  `X-Requested-With` header (`middleware/auth/csrf.js`)

## Tests

```bash
npm test             # run once
npm run test:watch   # re-run on change
```

Tests use an in-memory MongoDB (the first run downloads it), so your real
database is never touched. `tests/helpers.js` has `createUser({ role })` and
`authHeader(token)` for writing new ones.

## Adding a new feature (e.g. products)

1. `src/models/product.model.js` - define the schema
2. `src/validators/products/product.schema.js` - zod schemas for create/update
3. `src/controllers/products/product.controller.js` - write the handlers
4. `src/routes/products/product.routes.js` - map URLs to handlers with
   `validate(schema)` and `protect` / `authorize` as needed
5. `src/routes/index.js` - add `router.use('/products', productRoutes);`
6. `tests/products/product.test.js` - cover the routes
