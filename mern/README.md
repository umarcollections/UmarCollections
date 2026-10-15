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
   reference and a screenshot (required once uploads are set up). Status: payment being checked.
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

## Deploying to Vercel

One Vercel project serves both halves: the built client from `client/dist`, and the
Express app as a single function in `api/index.js`. Built files (scripts, styles,
images) come straight from Vercel's CDN; `vercel.json` sends every other address to
the function: the API, `/sitemap.xml`, `/robots.txt` and the storefront pages (see
[Search engines](#search-engines-seo)). Because the shop and the API share one
address, the login cookie stays first-party and no CORS or cookie settings are needed.

1. Push the repo to GitHub and import it in Vercel. Leave the root directory as the
   repo root; `vercel.json` sets the install, build and output settings.
2. In MongoDB Atlas, Network Access: allow `0.0.0.0/0`. Vercel's addresses change, so
   the database can't be locked to one IP; the strong database password protects it.
3. In Vercel, Settings, Environment Variables, add these for Production. The quick way:
   put them in a git-ignored `.env.vercel` file at the repo root and use "Import .env":

   | Variable                | Value                                                    |
   | ----------------------- | -------------------------------------------------------- |
   | `NODE_ENV`              | `production`                                             |
   | `MONGO_URI`             | the Atlas connection string                              |
   | `JWT_SECRET`            | a new long random string (see below)                     |
   | `ADMIN_EMAIL`           | the owner's admin email                                  |
   | `ADMIN_PASSWORD`        | a new admin password, 8 to 72 characters                 |
   | `TRUST_PROXY`           | `1`                                                      |
   | `CLOUDINARY_CLOUD_NAME` | from the Cloudinary dashboard                            |
   | `CLOUDINARY_API_KEY`    | from the Cloudinary dashboard                            |
   | `CLOUDINARY_API_SECRET` | from the Cloudinary dashboard                            |
   | `ALERT_WHATSAPP_PHONE`  | phone for order alerts, digits only, e.g. `923074801091` |
   | `CALLMEBOT_API_KEY`     | from CallMeBot (see below)                               |
   | `GMAIL_APP_PASSWORD`    | store Gmail App Password, for emails (see below)         |
   | `RESEND_API_KEY`        | from Resend, for emails (see below)                      |
   | `EMAIL_FROM`            | only after verifying a domain in Resend (see below)      |
   | `GOOGLE_CLIENT_ID`      | for "Continue with Google" (see below)                   |
   | `SITE_URL`              | the address people use, e.g. `https://example.com`       |

   Make a `JWT_SECRET` with:
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

4. Deploy. The admin account is created on the first request; sign in at `/admin/login`.

Notes:

- `SITE_URL` is the one address search engines are told to list (canonical links,
  sitemap, link previews). Without it Vercel's own `<project>.vercel.app` domain is
  used, which is wrong if that domain redirects to another one, so set it to the
  address in the browser bar, with `https://` and no trailing slash, and redeploy
  (the client reads it at build time). Change it when you add a custom domain.
- `CLIENT_URL` isn't needed on Vercel: the shop and the API share one address.
- The function runs in Mumbai (`regions: ["bom1"]` in `vercel.json`), next to the
  Atlas cluster (AWS ap-south-1). If the database moves, move the region with it.
- Each upload must stay under Vercel's 4.5 MB request limit, so images are capped at
  4 MB and the admin sends product photos one at a time.
- There is no always-on server, so overdue unpaid orders are cancelled while handling
  requests (at most every 10 minutes) instead of on a timer.
- Login and order rate limits are kept per function instance, so on Vercel they are
  looser than on a single server.
- WhatsApp alerts: on the phone that should get them, follow the WhatsApp steps on
  https://www.callmebot.com (save their number and send the message they show). The
  reply contains the API key. Without it the store works and simply sends no alerts.
- Emails go through the store's Gmail when `GMAIL_APP_PASSWORD` is set (no domain
  needed, about 500 a day; turn on 2-Step Verification, then create the password
  at myaccount.google.com/apppasswords). Otherwise they go through Resend: order placed (with bank details and the private order
  link) and order delivered to the customer; new
  order and payment to check to the owner (`OWNER_EMAIL`, default the store email);
  and forgot-password links. Until a domain is verified in Resend they only reach
  the Resend account's own address. After verifying (Resend, Domains), set
  `EMAIL_FROM`, e.g. `Umar Collections <orders@umarcollections.pk>`. A failed email
  is logged and never fails the order.
- "Continue with Google": in Google Cloud Console create a project, set up the OAuth
  consent screen (External, app name, support email, home/privacy/terms links) and
  publish it, then create an OAuth client of type Web application with Authorized
  JavaScript origins `http://localhost:5173` and the live address (e.g.
  `https://umarcollections.vercel.app`). No redirect URI and no client secret are
  needed. Put its client ID in `GOOGLE_CLIENT_ID`; the button appears on its own.
- Link previews (WhatsApp, Facebook) show the product's first photo on product pages
  and `client/public/og-image.jpg` everywhere else.

## Search engines (SEO)

Storefront pages are served by the API (`backend/src/controllers/seo/page.controller.js`)
as the built `client/dist/index.html` with that page's own head tags, so Google, Bing,
AI search tools and link previews see them without running the app:

- title, description and canonical address for every page; the app sets the same
  titles in the browser, so keep the two in step
- `noindex` on cart, checkout, orders, account, login and admin pages and on search
  results; a real 404 for unknown pages and products that are drafts or deleted
- structured data: site name (with the spellings in `alternateName`), the store's
  address and phone, breadcrumbs, and each product's price, sale price and stock.
  A product with sizes or colours lists each one with its own link (`?variant=<id>`)
- `/sitemap.xml` with every collection, product and product photo, built from live data

Store facts used for this are in `backend/src/config/store.js`. Add the store's
Instagram, Facebook or TikTok links to `profiles` there so Google connects them to
the site.

After deploying: in [Google Search Console](https://search.google.com/search-console)
add the site as a URL-prefix property, verify it with the HTML file Google gives you
(put it in `client/public/` and redeploy), submit `<SITE_URL>/sitemap.xml`, and check
product pages with the [Rich Results Test](https://search.google.com/test/rich-results).
Bing Webmaster Tools can import the site from Search Console.

Other hosts: run `npm start` for the API and serve `client/dist`, keeping both on one
site (or set `COOKIE_SAMESITE=none` if they are on different sites). Set `SITE_URL`,
`CLIENT_URL` and `TRUST_PROXY=1`, and build the client with `VITE_API_URL` if the API
is on another address.
