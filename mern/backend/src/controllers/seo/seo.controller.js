import Category from '../../models/category.model.js';
import Product from '../../models/product.model.js';
import siteUrl from '../../utils/siteUrl.js';

// Pages search engines may list. Cart, checkout, order links, accounts and the
// admin are private or personal, so robots.txt asks crawlers to skip them.
const STATIC_PAGES = ['/', '/shop', '/collections', '/about', '/terms', '/privacy'];
const PRIVATE_PATHS = [
  '/admin',
  '/account',
  '/cart',
  '/checkout',
  '/orders/',
  '/reset-password',
  '/api/',
];

const escapeXml = (text) =>
  text.replace(
    /[<>&'"]/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]
  );

const urlEntry = (loc, lastmod) =>
  `  <url><loc>${escapeXml(loc)}</loc>${
    lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''
  }</url>`;

// GET /sitemap.xml
// Built from live data, so new products and categories appear without a deploy
export const sitemap = async (req, res) => {
  const base = siteUrl(req);
  const [categories, products] = await Promise.all([
    Category.find().select('slug updatedAt').sort({ name: 1 }),
    Product.find({ status: 'active' }).select('slug updatedAt').sort({ createdAt: -1 }),
  ]);

  const urls = [
    ...STATIC_PAGES.map((path) => urlEntry(`${base}${path}`)),
    ...categories.map((c) => urlEntry(`${base}/shop?category=${c.slug}`, c.updatedAt)),
    ...products.map((p) => urlEntry(`${base}/products/${p.slug}`, p.updatedAt)),
  ];

  res
    .type('application/xml')
    .set('Cache-Control', 'public, max-age=3600')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
    );
};

// GET /robots.txt
export const robots = (req, res) => {
  const lines = [
    'User-agent: *',
    ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${siteUrl(req)}/sitemap.xml`,
  ];
  res
    .type('text/plain')
    .set('Cache-Control', 'public, max-age=86400')
    .send(`${lines.join('\n')}\n`);
};
