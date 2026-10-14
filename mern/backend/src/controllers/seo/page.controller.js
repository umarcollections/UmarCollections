import store from '../../config/store.js';
import Category from '../../models/category.model.js';
import Product from '../../models/product.model.js';
import siteUrl from '../../utils/siteUrl.js';
import renderPage from '../../utils/seo/pageTemplate.js';
import {
  breadcrumbData,
  productData,
  storeData,
  websiteData,
} from '../../utils/seo/structuredData.js';

// Storefront pages are the client app's index.html with each page's own head
// tags, so search engines and link previews see the right title, description
// and product details without running the app. The app sets the same titles
// in the browser; keep them in step with the pages in client/src/pages.

// Search engines show about this many characters of a description
const DESCRIPTION_LENGTH = 155;
// Browsers check back every visit; Vercel's CDN keeps a copy for 5 minutes
const CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
// Personal or private pages: the app shows them, search engines leave them out
const PRIVATE_PAGES = {
  '/cart': 'Cart',
  '/checkout': 'Checkout',
  '/login': 'Log in',
  '/signup': 'Create an account',
  '/forgot-password': 'Forgot password',
  '/reset-password': 'Choose a new password',
  '/account': 'Your account',
  '/admin': 'Store admin',
};
const PRIVATE_PREFIXES = [
  ['/orders/', ''],
  ['/admin/', 'Store admin'],
];

// client/public/og-image.jpg, for pages without a photo of their own
const defaultImage = (base) => ({
  url: `${base}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: `${store.name}, clothing, bags and shoes in ${store.city}`,
});

const shorten = (text) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= DESCRIPTION_LENGTH
    ? flat
    : `${flat.slice(0, DESCRIPTION_LENGTH - 1).replace(/\s+\S*$/, '')}…`;
};

// "a, b and c"
const listOf = (words) =>
  words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : (words[0] ?? '');

const categoryNames = async () =>
  (await Category.find().select('name').sort({ name: 1 })).map((c) => c.name.toLowerCase());

const queryText = (value) => (typeof value === 'string' ? value.trim() : '');

const absolute = (base, url) => (url.startsWith('/') ? `${base}${url}` : url);

// Link previews need JPEG or PNG; Cloudinary converts on the fly. Other
// photos (such as the SVG demo artwork) fall back to the store's image.
const previewImage = (base, image, alt) => {
  if (/^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\//.test(image?.url ?? '')) {
    return { url: image.url.replace('/image/upload/', '/image/upload/c_limit,w_1200,f_jpg/'), alt };
  }
  if (/\.(jpe?g|png)$/i.test(image?.url ?? '')) return { url: absolute(base, image.url), alt };
  return null;
};

const sendPage = async (req, res, page) => {
  const base = siteUrl(req);
  const image = page.image ?? defaultImage(base);
  const html = await renderPage(`${req.protocol}://${req.get('host')}`, {
    type: 'website',
    indexable: false,
    structuredData: [],
    currency: store.currency,
    ...page,
    title: page.title ? `${page.title} | ${store.name}` : `${store.name}: ${store.tagline}`,
    description: shorten(page.description || store.description),
    url: page.canonical ?? `${base}${req.path}`,
    image,
  });

  // index.html shows photos from Cloudinary and fonts from Google, which the
  // API's strict Content-Security-Policy (from helmet) would block
  res.removeHeader('Content-Security-Policy');
  res
    .status(page.status ?? 200)
    .set('Cache-Control', CACHE_CONTROL)
    .type('html')
    .send(html);
};

// GET /
export const homePage = async (req, res) => {
  const base = siteUrl(req);
  await sendPage(req, res, {
    indexable: true,
    canonical: `${base}/`,
    structuredData: [websiteData(base), storeData(base)],
  });
};

// GET /shop?category=&q=&page=
// Sorting is left out of the canonical address, so every order of the same
// list counts as one page. Search results are not listed in search engines.
export const shopPage = async (req, res) => {
  const base = siteUrl(req);
  const q = queryText(req.query.q);
  const slug = queryText(req.query.category);
  const pageNumber = Number(queryText(req.query.page));
  const paged = Number.isInteger(pageNumber) && pageNumber > 1;
  const pageSuffix = paged ? `, page ${pageNumber}` : '';

  if (q) {
    return sendPage(req, res, { title: `Search: ${q}` });
  }

  const category = slug && (await Category.findOne({ slug }));
  if (slug && !category) {
    return sendPage(req, res, { status: 404, title: 'Page not found' });
  }

  const params = new URLSearchParams({
    ...(category && { category: category.slug }),
    ...(paged && { page: String(pageNumber) }),
  }).toString();
  const canonical = `${base}/shop${params ? `?${params}` : ''}`;

  if (!category) {
    const names = await categoryNames();
    return sendPage(req, res, {
      indexable: true,
      canonical,
      title: `Shop Online in ${store.city}: All Products${pageSuffix}`,
      description: `Shop ${listOf(names)} at ${store.name}. Sizes, fabric and live stock on every product, with delivery within ${store.city}.`,
    });
  }

  await sendPage(req, res, {
    indexable: true,
    canonical,
    title: `Buy ${category.name} Online in ${store.city}${pageSuffix}`,
    description: `${category.description} Buy ${category.name.toLowerCase()} online at ${store.name}, with delivery within ${store.city}.`,
    structuredData: [
      breadcrumbData([
        ['Shop', `${base}/shop`],
        [category.name, canonical],
      ]),
    ],
  });
};

// GET /products/:slug
export const productPage = async (req, res) => {
  const base = siteUrl(req);
  const product = await Product.findOne({ slug: req.params.slug, status: 'active' }).populate(
    'category',
    'name slug'
  );
  if (!product) {
    return sendPage(req, res, { status: 404, title: 'Product not found' });
  }

  const url = `${base}/products/${product.slug}`;
  const images = product.images.map((image) => absolute(base, image.url));
  const crumbs = [['Shop', `${base}/shop`]];
  if (product.category) {
    crumbs.push([product.category.name, `${base}/shop?category=${product.category.slug}`]);
  }
  crumbs.push([product.title, url]);

  await sendPage(req, res, {
    indexable: true,
    canonical: url,
    type: 'product',
    title: product.title,
    description:
      product.description ||
      `Buy ${product.title} online at ${store.name}, with delivery within ${store.city}.`,
    image: previewImage(base, product.images[0], product.images[0]?.alt || product.title),
    price: product.priceMin,
    structuredData: [productData(product, { url, images, base }), breadcrumbData(crumbs)],
  });
};

// GET /collections
export const collectionsPage = async (req, res) => {
  const names = await categoryNames();
  await sendPage(req, res, {
    indexable: true,
    canonical: `${siteUrl(req)}/collections`,
    title: 'All Collections',
    description: `Browse every collection at ${store.name}: ${listOf(names)}. Delivery within ${store.city}.`,
  });
};

const INFO_PAGES = {
  '/about': {
    title: 'About Us & Contact',
    description: `${store.name} is an online clothing, bags and shoes store in ${store.city}. Call or WhatsApp ${store.phone} or email us with any question.`,
    withStore: true,
  },
  '/terms': {
    title: 'Terms and Conditions',
    description: `How ordering, payment by bank transfer, delivery within ${store.city} and returns work at ${store.name}.`,
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: `What ${store.name} collects when you order, why we collect it and who we share it with.`,
  },
};

// GET /about, /terms, /privacy
export const infoPage = async (req, res) => {
  const base = siteUrl(req);
  const { title, description, withStore } = INFO_PAGES[req.path.replace(/\/$/, '')];
  await sendPage(req, res, {
    indexable: true,
    canonical: `${base}${req.path.replace(/\/$/, '')}`,
    title,
    description,
    structuredData: withStore ? [storeData(base)] : [],
  });
};

// Every other address: private pages open normally but stay out of search
// results; anything else is a 404 (the app then sends visitors home)
export const otherPage = async (req, res) => {
  const path = req.path.replace(/(.)\/$/, '$1');
  if (Object.hasOwn(PRIVATE_PAGES, path)) return sendPage(req, res, { title: PRIVATE_PAGES[path] });
  const prefix = PRIVATE_PREFIXES.find(([start]) => path.startsWith(start));
  if (prefix) return sendPage(req, res, { title: prefix[1] });
  await sendPage(req, res, { status: 404, title: 'Page not found' });
};
