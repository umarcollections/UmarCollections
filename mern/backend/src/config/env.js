import 'dotenv/config';
import store from './store.js';

// Every env var the app reads lives here, so a missing value stops the
// server at startup instead of failing on the first request that needs it.
const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];

const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(
    `Missing required environment variable(s): ${missing.join(', ')}\n` +
      'Copy backend/.env.example to backend/.env and fill them in.'
  );
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn('Warning: JWT_SECRET is shorter than 32 characters. Use a long random string.');
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma separated list of origins allowed by CORS
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  // Number of proxy hops to trust (0 = none), see app.js
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  // Product photos and payment screenshots are stored on Cloudinary. Optional:
  // without these the API runs and uploads answer 503 until they are added.
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
  },
  // Public address of the store, for links in WhatsApp alerts and the sitemap.
  // On Vercel it defaults to the project's production domain; elsewhere the
  // address the request came in on is used.
  siteUrl: (
    process.env.SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '')
  ).replace(/\/$/, ''),
  // Set by Vercel on its servers (see utils/seo/pageTemplate.js)
  isVercel: Boolean(process.env.VERCEL),
  // New-order alerts to the owner's WhatsApp through CallMeBot. Optional:
  // without both values no alerts are sent.
  whatsappAlerts: {
    phone: process.env.ALERT_WHATSAPP_PHONE?.replace(/\D/g, ''),
    apiKey: process.env.CALLMEBOT_API_KEY?.trim(),
  },
  // Emails to customers and the owner, sent through Resend. Optional: without
  // RESEND_API_KEY no emails are sent and everything else works.
  email: {
    apiKey: process.env.RESEND_API_KEY?.trim(),
    // Until a domain is verified in Resend, only their test sender works, and
    // it only delivers to the Resend account's own email address
    from: process.env.EMAIL_FROM?.trim() || 'Umar Collections <onboarding@resend.dev>',
    // Where order alerts for the owner go
    owner: process.env.OWNER_EMAIL?.trim() || store.email,
  },
  // The store owner's login. On startup this account is created, or made an
  // admin with this password if it already exists (see utils/auth/seedAdmin.js).
  admin: {
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD,
  },
};

env.cloudinary.enabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
env.whatsappAlerts.enabled = Boolean(env.whatsappAlerts.phone && env.whatsappAlerts.apiKey);
env.email.enabled = Boolean(env.email.apiKey);

if (Boolean(env.admin.email) !== Boolean(env.admin.password)) {
  console.error('Set both ADMIN_EMAIL and ADMIN_PASSWORD, or neither');
  process.exit(1);
}
if (env.admin.password && (env.admin.password.length < 8 || env.admin.password.length > 72)) {
  console.error('ADMIN_PASSWORD must be 8 to 72 characters');
  process.exit(1);
}

env.isDev = env.nodeEnv === 'development';
env.isTest = env.nodeEnv === 'test';
env.isProd = env.nodeEnv === 'production';

// Auth cookie: 'lax' works when client and API share a site (same domain or
// subdomains). Use 'none' only for different sites; it requires HTTPS.
env.cookieSameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
env.cookieSecure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : env.isProd || env.cookieSameSite === 'none';

if (!['lax', 'strict', 'none'].includes(env.cookieSameSite)) {
  console.error('COOKIE_SAMESITE must be one of: lax, strict, none');
  process.exit(1);
}
if (env.cookieSameSite === 'none' && !env.cookieSecure) {
  console.error('COOKIE_SAMESITE=none requires COOKIE_SECURE=true (HTTPS)');
  process.exit(1);
}

export default env;
