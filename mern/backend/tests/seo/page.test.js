import { describe, expect, it, vi } from 'vitest';
import Category from '../../src/models/category.model.js';
import Product from '../../src/models/product.model.js';
import { api } from '../helpers.js';

// Stands in for client/dist/index.html, so these tests don't need a client build
const { TEMPLATE } = vi.hoisted(() => ({
  TEMPLATE: [
    '<html><head>',
    '<!-- page-meta --><title>Default</title><!-- /page-meta -->',
    '</head><body><div id="root"></div></body></html>',
  ].join('\n'),
}));

vi.mock('node:fs/promises', async (importOriginal) => ({
  ...(await importOriginal()),
  readFile: vi.fn(async () => TEMPLATE),
}));

const base = (res) => `http://${res.request.host}`;
const titleOf = (res) => res.text.match(/<title>(.*?)<\/title>/)?.[1];
const metaOf = (res, key) =>
  res.text.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))?.[1];
const canonicalOf = (res) => res.text.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
const structuredData = (res) =>
  [...res.text.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1])
  );
const dataOfType = (res, type) => structuredData(res).find((data) => data['@type'] === type);

const seed = async () => {
  const bags = await Category.create({
    name: 'Bags',
    slug: 'bags',
    description: 'Totes and backpacks.',
  });
  await Category.create({ name: 'Shoes', slug: 'shoes' });
  const tote = await Product.create({
    title: 'Leather Tote',
    slug: 'leather-tote',
    description: 'A roomy tote.\n\nMaterial: leather',
    status: 'active',
    category: bags.id,
    images: [
      { url: 'https://res.cloudinary.com/demo/image/upload/v1/products/tote.webp', publicId: 'x' },
    ],
    variants: [{ price: 9000, stock: 2, sku: 'TOTE-1' }],
  });
  const shirt = await Product.create({
    title: 'Linen Shirt',
    slug: 'linen-shirt',
    status: 'active',
    options: [
      { name: 'Size', values: ['M', 'L'] },
      { name: 'Colour', values: ['White'] },
    ],
    variants: [
      { optionValues: ['M', 'White'], price: 3000, compareAtPrice: 4000, stock: 1 },
      { optionValues: ['L', 'White'], price: 3200, stock: 0 },
    ],
  });
  await Product.create({
    title: 'Not Ready',
    slug: 'not-ready',
    status: 'draft',
    variants: [{ price: 100, stock: 1 }],
  });
  return { tote, shirt };
};

describe('storefront pages', () => {
  it('serves the home page with the site name and store details for Google', async () => {
    const res = await api().get('/');

    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.headers['content-security-policy']).toBeUndefined();
    expect(res.headers['cache-control']).toContain('s-maxage=');
    expect(titleOf(res)).toBe('Umar Collections: Clothing, Bags &amp; Shoes in Faisalabad');
    expect(canonicalOf(res)).toBe(`${base(res)}/`);
    expect(metaOf(res, 'robots')).toContain('index, follow');
    expect(metaOf(res, 'og:image')).toBe(`${base(res)}/og-image.jpg`);
    expect(res.text).toContain('<div id="root"></div>');

    const website = dataOfType(res, 'WebSite');
    expect(website.name).toBe('Umar Collections');
    expect(website.alternateName).toContain('Umar Collection');
    expect(website.url).toBe(`${base(res)}/`);
    const store = dataOfType(res, 'OnlineStore');
    expect(store.telephone).toBe('+923074801091');
    expect(store.address.addressLocality).toBe('Faisalabad');
  });

  it('describes a single-variant product with its price, stock and breadcrumbs', async () => {
    await seed();
    const res = await api().get('/products/leather-tote');

    expect(res.status).toBe(200);
    expect(titleOf(res)).toBe('Leather Tote | Umar Collections');
    expect(metaOf(res, 'description')).toBe('A roomy tote. Material: leather');
    expect(canonicalOf(res)).toBe(`${base(res)}/products/leather-tote`);
    expect(metaOf(res, 'og:type')).toBe('product');
    expect(metaOf(res, 'og:image')).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_limit,w_1200,f_jpg/v1/products/tote.webp'
    );
    expect(metaOf(res, 'product:price:amount')).toBe('9000');

    const product = dataOfType(res, 'Product');
    expect(product).toMatchObject({
      name: 'Leather Tote',
      sku: 'TOTE-1',
      category: 'Bags',
      image: ['https://res.cloudinary.com/demo/image/upload/v1/products/tote.webp'],
      offers: {
        '@type': 'Offer',
        price: 9000,
        priceCurrency: 'PKR',
        availability: 'https://schema.org/InStock',
        url: `${base(res)}/products/leather-tote`,
      },
    });
    const crumbs = dataOfType(res, 'BreadcrumbList').itemListElement;
    expect(crumbs.map((crumb) => crumb.name)).toEqual(['Shop', 'Bags', 'Leather Tote']);
    expect(crumbs[1].item).toBe(`${base(res)}/shop?category=bags`);
  });

  it('describes a product with variants as a group with a link to each variant', async () => {
    const { shirt } = await seed();
    const res = await api().get('/products/linen-shirt');
    const group = dataOfType(res, 'ProductGroup');
    const [medium, large] = shirt.variants;

    expect(group.variesBy).toEqual(['https://schema.org/size', 'https://schema.org/color']);
    expect(group.hasVariant).toHaveLength(2);
    expect(group.hasVariant[0]).toMatchObject({
      name: 'Linen Shirt - M / White',
      size: 'M',
      color: 'White',
      offers: {
        url: `${base(res)}/products/linen-shirt?variant=${medium.id}`,
        price: 3000,
        availability: 'https://schema.org/InStock',
        priceSpecification: {
          priceType: 'https://schema.org/StrikethroughPrice',
          price: 4000,
        },
      },
    });
    expect(group.hasVariant[1].offers.url).toContain(`?variant=${large.id}`);
    expect(group.hasVariant[1].offers.availability).toBe('https://schema.org/OutOfStock');
    expect(group.hasVariant[1].offers.priceSpecification).toBeUndefined();
    // No photos and no description: the default preview image and wording
    expect(metaOf(res, 'og:image')).toBe(`${base(res)}/og-image.jpg`);
    expect(metaOf(res, 'description')).toContain('Buy Linen Shirt online at Umar Collections');
  });

  it('answers 404 for draft and unknown products, kept out of search results', async () => {
    await seed();
    for (const path of ['/products/not-ready', '/products/nothing-here']) {
      const res = await api().get(path);
      expect(res.status).toBe(404);
      expect(res.type).toBe('text/html');
      expect(metaOf(res, 'robots')).toBe('noindex');
      expect(canonicalOf(res)).toBeUndefined();
    }
  });

  it('gives each shop listing one canonical address, without the sort order', async () => {
    await seed();
    const all = await api().get('/shop?sort=price-asc');
    expect(all.status).toBe(200);
    expect(canonicalOf(all)).toBe(`${base(all)}/shop`);
    expect(titleOf(all)).toBe('Shop Online in Faisalabad: All Products | Umar Collections');
    expect(metaOf(all, 'description')).toContain('Shop bags and shoes at Umar Collections');

    const bags = await api().get('/shop?category=bags&sort=newest&page=2');
    expect(canonicalOf(bags)).toBe(`${base(bags)}/shop?category=bags&amp;page=2`);
    expect(titleOf(bags)).toBe('Buy Bags Online in Faisalabad, page 2 | Umar Collections');
    expect(metaOf(bags, 'description')).toBe(
      'Totes and backpacks. Buy bags online at Umar Collections, with delivery within Faisalabad.'
    );
  });

  it('keeps search results out of search engines and 404s unknown categories', async () => {
    await seed();
    const search = await api().get('/shop?q=tote');
    expect(search.status).toBe(200);
    expect(metaOf(search, 'robots')).toBe('noindex');
    expect(canonicalOf(search)).toBeUndefined();

    const unknown = await api().get('/shop?category=nope');
    expect(unknown.status).toBe(404);
  });

  it('lists the collections and the about page with the store details', async () => {
    await seed();
    const collections = await api().get('/collections');
    expect(canonicalOf(collections)).toBe(`${base(collections)}/collections`);
    expect(metaOf(collections, 'description')).toContain('bags and shoes');

    const about = await api().get('/about/');
    expect(titleOf(about)).toBe('About Us &amp; Contact | Umar Collections');
    expect(canonicalOf(about)).toBe(`${base(about)}/about`);
    expect(dataOfType(about, 'OnlineStore')).toBeDefined();
  });

  it('opens private pages but keeps them out of search results', async () => {
    for (const [path, title] of [
      ['/cart', 'Cart | Umar Collections'],
      ['/login', 'Log in | Umar Collections'],
      ['/orders/1001?key=secret', 'Umar Collections: Clothing, Bags &amp; Shoes in Faisalabad'],
      ['/admin/products', 'Store admin | Umar Collections'],
    ]) {
      const res = await api().get(path);
      expect(res.status).toBe(200);
      expect(titleOf(res)).toBe(title);
      expect(metaOf(res, 'robots')).toBe('noindex');
      expect(res.text).not.toContain('secret');
    }
  });

  it('answers 404 for unknown pages, while unknown API routes stay JSON', async () => {
    const page = await api().get('/no-such-page');
    expect(page.status).toBe(404);
    expect(page.type).toBe('text/html');
    expect(metaOf(page, 'robots')).toBe('noindex');

    const apiRoute = await api().get('/api/no-such-route');
    expect(apiRoute.status).toBe(404);
    expect(apiRoute.body.success).toBe(false);

    const health = await api().get('/api/health');
    expect(health.body.success).toBe(true);
  });

  it('escapes text from the admin in tags and structured data', async () => {
    await Product.create({
      title: 'Tote "</script><script>alert(1)</script>',
      slug: 'odd-tote',
      status: 'active',
      variants: [{ price: 100, stock: 1 }],
    });
    const res = await api().get('/products/odd-tote');

    expect(res.text).not.toContain('<script>alert(1)');
    expect(titleOf(res)).toBe(
      'Tote &quot;&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt; | Umar Collections'
    );
    expect(dataOfType(res, 'Product').name).toBe('Tote "</script><script>alert(1)</script>');
  });
});
