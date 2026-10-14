import { Router } from 'express';
import {
  collectionsPage,
  homePage,
  infoPage,
  otherPage,
  productPage,
  shopPage,
} from '../../controllers/seo/page.controller.js';

// Storefront pages, served as the client's index.html with each page's own
// head tags. app.js mounts this after the API, and it never answers /api.
const router = Router();

router.get('/', homePage);
router.get('/shop', shopPage);
router.get('/products/:slug', productPage);
router.get('/collections', collectionsPage);
router.get(['/about', '/terms', '/privacy'], infoPage);
router.get(/^\/(?!api(?:\/|$))/, otherPage);

export default router;
