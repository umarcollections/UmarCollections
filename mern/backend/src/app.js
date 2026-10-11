import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import routes from './routes/index.js';
import seoRoutes from './routes/seo/seo.routes.js';
import csrfProtection from './middleware/auth/csrf.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Behind a reverse proxy (Render, Railway, Nginx...) set TRUST_PROXY=1 so
// rate limiting sees the real client IP instead of the proxy's
if (env.trustProxy) app.set('trust proxy', env.trustProxy);

// Global middleware
app.use(helmet());
// credentials: true lets the browser send the auth cookie cross-origin
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);

// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// sitemap.xml and robots.txt, which crawlers expect at the site root
app.use(seoRoutes);

// All API routes live under /api
app.use('/api', routes);

// These two must stay last
app.use(notFound);
app.use(errorHandler);

export default app;
