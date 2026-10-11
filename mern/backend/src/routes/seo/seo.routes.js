import { Router } from 'express';
import { robots, sitemap } from '../../controllers/seo/seo.controller.js';

// Search engines look for these at the root of the site, not under /api, so
// app.js mounts this router before the API routes
const router = Router();

router.get('/sitemap.xml', sitemap);
router.get('/robots.txt', robots);

export default router;
