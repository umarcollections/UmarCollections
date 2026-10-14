import { readFile } from 'node:fs/promises';
import env from '../../config/env.js';

// The client's built index.html. vercel.json bundles it with the API function.
const BUILT_PAGE = new URL('../../../../client/dist/index.html', import.meta.url);
// index.html marks the tags each page replaces with its own
const PAGE_META = /<!-- page-meta -->[\s\S]*?<!-- \/page-meta -->/;

let template;

const loadTemplate = async (origin) => {
  try {
    return await readFile(BUILT_PAGE, 'utf8');
  } catch (error) {
    if (!env.isVercel) {
      throw new Error('client/dist/index.html not found. Run npm run build first.', {
        cause: error,
      });
    }
    // Vercel's CDN serves static files before any rewrite, so this request is
    // answered with the file itself and can't loop back to this function
    const res = await fetch(`${origin}/index.html`);
    if (!res.ok) {
      throw new Error(`Could not load ${origin}/index.html (${res.status})`, { cause: error });
    }
    return res.text();
  }
};

// Read once per server instance; a new deployment starts new instances
const pageTemplate = (origin) => {
  template ??= loadTemplate(origin).catch((error) => {
    template = undefined;
    throw error;
  });
  return template;
};

const escapeHtml = (text) =>
  String(text).replace(
    /[<>&'"]/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' })[char]
  );

const metaTag = (attribute, key, value) =>
  value == null ? '' : `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;

// "<" is escaped so text from the admin can never close the script tag
const jsonLdTag = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

// The head tags for one page: title, description, canonical address, link
// previews (WhatsApp, Facebook, X) and structured data for Google
const headTags = (meta) =>
  [
    `<title>${escapeHtml(meta.title)}</title>`,
    metaTag('name', 'description', meta.description),
    metaTag(
      'name',
      'robots',
      meta.indexable ? 'index, follow, max-image-preview:large' : 'noindex'
    ),
    meta.canonical && `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    metaTag('property', 'og:type', meta.type),
    metaTag('property', 'og:title', meta.title),
    metaTag('property', 'og:description', meta.description),
    metaTag('property', 'og:url', meta.url),
    metaTag('property', 'og:image', meta.image.url),
    metaTag('property', 'og:image:width', meta.image.width),
    metaTag('property', 'og:image:height', meta.image.height),
    metaTag('property', 'og:image:alt', meta.image.alt),
    metaTag('property', 'product:price:amount', meta.price),
    metaTag('property', 'product:price:currency', meta.price != null ? meta.currency : null),
    metaTag('name', 'twitter:card', 'summary_large_image'),
    ...meta.structuredData.map(jsonLdTag),
  ]
    .filter(Boolean)
    .join('\n    ');

// index.html with this page's head tags in place of the defaults
const renderPage = async (origin, meta) =>
  (await pageTemplate(origin)).replace(PAGE_META, () => headTags(meta));

export default renderPage;
