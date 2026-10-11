import { describe, expect, it } from 'vitest';
import Category from '../../src/models/category.model.js';
import Product from '../../src/models/product.model.js';
import { api } from '../helpers.js';

const seed = async () => {
  const bags = await Category.create({ name: 'Bags', slug: 'bags' });
  await Product.create({
    title: 'Leather Tote',
    slug: 'leather-tote',
    status: 'active',
    category: bags.id,
    variants: [{ price: 9000, stock: 2 }],
  });
  await Product.create({
    title: 'Not Ready',
    slug: 'not-ready',
    status: 'draft',
    variants: [{ price: 100, stock: 1 }],
  });
};

describe('GET /sitemap.xml', () => {
  it('lists the shop pages, categories and active products only', async () => {
    await seed();
    const res = await api().get('/sitemap.xml');
    const base = `http://${res.request.host}`;

    expect(res.status).toBe(200);
    expect(res.type).toBe('application/xml');
    expect(res.text).toContain(`<loc>${base}/</loc>`);
    expect(res.text).toContain(`<loc>${base}/shop</loc>`);
    expect(res.text).toContain(`<loc>${base}/shop?category=bags</loc>`);
    expect(res.text).toMatch(
      new RegExp(`<loc>${base}/products/leather-tote</loc><lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`)
    );
    expect(res.text).not.toContain('not-ready');
    expect(res.text).not.toContain('/checkout');
  });
});

describe('GET /robots.txt', () => {
  it('keeps crawlers out of private pages and points to the sitemap', async () => {
    const res = await api().get('/robots.txt');

    expect(res.status).toBe(200);
    expect(res.type).toBe('text/plain');
    for (const path of ['/admin', '/account', '/cart', '/checkout', '/orders/', '/api/']) {
      expect(res.text).toContain(`Disallow: ${path}\n`);
    }
    expect(res.text).toContain(`Sitemap: http://${res.request.host}/sitemap.xml`);
  });
});
