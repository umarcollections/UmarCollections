import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteImage, isImageStorageReady, uploadImage } from '../../src/utils/imageStorage.js';
import Product from '../../src/models/product.model.js';
import { api, authHeader, createUser } from '../helpers.js';

// Never talk to Cloudinary from tests
vi.mock('../../src/utils/imageStorage.js', () => ({
  isImageStorageReady: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

const shirt = {
  title: 'Linen Shirt',
  status: 'active',
  options: [
    { name: 'Size', values: ['S', 'M'] },
    { name: 'Colour', values: ['White', 'Black'] },
  ],
  variants: [
    { optionValues: ['S', 'White'], sku: 'LS-S-W', price: 40, stock: 3 },
    { optionValues: ['M', 'White'], sku: 'LS-M-W', price: 40, stock: 0 },
    { optionValues: ['M', 'Black'], price: 45, compareAtPrice: 60, stock: 2 },
  ],
};

const asAdmin = async () => (await createUser({ role: 'admin' })).token;

const createProduct = (token, body = shirt) =>
  api().post('/api/admin/products').set(authHeader(token)).send(body);

const uploadFiles = (token, id, count = 1) => {
  const req = api().post(`/api/admin/products/${id}/images`).set(authHeader(token));
  for (let i = 0; i < count; i += 1) {
    req.attach('images', Buffer.from('fake image'), {
      filename: `photo${i}.jpg`,
      contentType: 'image/jpeg',
    });
  }
  return req;
};

beforeEach(() => {
  let n = 0;
  uploadImage.mockReset().mockImplementation(async () => {
    n += 1;
    return { url: `https://img.test/${n}.jpg`, publicId: `products/${n}` };
  });
  deleteImage.mockReset().mockResolvedValue({ result: 'ok' });
  isImageStorageReady.mockReset().mockReturnValue(true);
});

describe('admin products', () => {
  it('is admin only', async () => {
    const { token } = await createUser();

    const anonymous = await api().get('/api/admin/products');
    const customer = await api().get('/api/admin/products').set(authHeader(token));

    expect(anonymous.status).toBe(401);
    expect(customer.status).toBe(403);
  });

  it('creates a product with variants, a slug and a price range', async () => {
    const token = await asAdmin();
    const res = await createProduct(token);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      slug: 'linen-shirt',
      priceMin: 40,
      priceMax: 45,
      inStock: true,
    });
    expect(res.body.data.variants).toHaveLength(3);
    expect(res.body.data.variants[0]._id).toBeDefined();

    const again = await createProduct(token);
    expect(again.body.data.slug).toBe('linen-shirt-2');
  });

  it('creates a simple product with one variant and no options', async () => {
    const token = await asAdmin();
    const res = await createProduct(token, {
      title: 'Canvas Tote',
      variants: [{ price: 25.999, stock: 5 }],
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'draft', options: [] });
    expect(res.body.data.variants[0].price).toBe(26);
  });

  it.each([
    [
      'variant values that are not options',
      { variants: [{ ...shirt.variants[0], optionValues: ['XL', 'White'] }] },
    ],
    [
      'two variants with the same options',
      { variants: [shirt.variants[0], { ...shirt.variants[0], sku: 'X' }] },
    ],
    ['duplicate SKUs', { variants: [shirt.variants[0], { ...shirt.variants[1], sku: 'LS-S-W' }] }],
    [
      'a compare-at price below the price',
      { variants: [{ ...shirt.variants[0], compareAtPrice: 30 }] },
    ],
    ['duplicate option names', { options: [shirt.options[0], { name: 'size', values: ['L'] }] }],
    ['negative stock', { variants: [{ ...shirt.variants[0], stock: -1 }] }],
    ['no variants', { variants: [] }],
  ])('rejects %s', async (_, override) => {
    const token = await asAdmin();
    const res = await createProduct(token, { ...shirt, ...override });
    expect(res.status).toBe(400);
  });

  it('rejects more than one variant on a product without options', async () => {
    const token = await asAdmin();
    const res = await createProduct(token, {
      title: 'Belt',
      variants: [
        { price: 10, stock: 1 },
        { price: 12, stock: 1 },
      ],
    });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown category', async () => {
    const token = await asAdmin();
    const res = await createProduct(token, { ...shirt, category: '000000000000000000000000' });
    expect(res.status).toBe(400);
  });

  it('keeps variant ids on update and recalculates the price range', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;
    const [first] = product.variants;

    const res = await api()
      .put(`/api/admin/products/${product._id}`)
      .set(authHeader(token))
      .send({
        title: 'Linen Shirt, Relaxed Fit',
        options: [{ name: 'Size', values: ['S'] }],
        variants: [{ _id: first._id, optionValues: ['S'], price: 50, stock: 7 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ slug: 'linen-shirt', priceMin: 50, priceMax: 50 });
    expect(res.body.data.variants).toHaveLength(1);
    expect(res.body.data.variants[0]._id).toBe(first._id);
  });

  it('applies only the stock change when stock moved while the form was open', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;
    const [small] = product.variants; // stock 3 when the admin opened the form

    // An order reserves 2 in the meantime
    await Product.updateOne(
      { _id: product._id, 'variants._id': small._id },
      { $inc: { 'variants.$.stock': -2 } }
    );

    // The admin adds 5 (3 -> 8 in the form) and saves
    const res = await api()
      .put(`/api/admin/products/${product._id}`)
      .set(authHeader(token))
      .send({
        options: shirt.options,
        variants: product.variants.map((v) =>
          v._id === small._id ? { ...v, stock: 8, baseStock: 3 } : { ...v, baseStock: v.stock }
        ),
      });

    expect(res.status).toBe(200);
    expect(res.body.data.variants[0].stock).toBe(6);
    expect(res.body.data.variants[0].baseStock).toBeUndefined();
  });

  it('requires options and variants to be updated together', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;

    const res = await api()
      .put(`/api/admin/products/${product._id}`)
      .set(authHeader(token))
      .send({ variants: [{ optionValues: ['S', 'White'], price: 1, stock: 1 }] });
    expect(res.status).toBe(400);
  });

  it('filters the admin list by status and search', async () => {
    const token = await asAdmin();
    await createProduct(token);
    await createProduct(token, { title: 'Wool Scarf', variants: [{ price: 20, stock: 1 }] });

    const drafts = await api().get('/api/admin/products?status=draft').set(authHeader(token));
    const search = await api().get('/api/admin/products?q=linen').set(authHeader(token));

    expect(drafts.body.data.map((p) => p.title)).toEqual(['Wool Scarf']);
    expect(search.body.data.map((p) => p.title)).toEqual(['Linen Shirt']);
    expect(search.body.pagination).toMatchObject({ page: 1, total: 1, pages: 1 });
  });

  it('deletes a product and its images', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;
    await uploadFiles(token, product._id, 2);

    const res = await api().delete(`/api/admin/products/${product._id}`).set(authHeader(token));

    expect(res.status).toBe(200);
    expect(deleteImage).toHaveBeenCalledTimes(2);
    const gone = await api().get(`/api/admin/products/${product._id}`).set(authHeader(token));
    expect(gone.status).toBe(404);
  });
});

describe('product images', () => {
  it('uploads images with the title as alt text', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;

    const res = await uploadFiles(token, product._id, 2);

    expect(res.status).toBe(201);
    expect(res.body.data.images).toHaveLength(2);
    expect(res.body.data.images[0]).toMatchObject({
      url: 'https://img.test/1.jpg',
      alt: 'Linen Shirt',
    });
  });

  it('explains that uploads are off until Cloudinary is configured', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;
    isImageStorageReady.mockReturnValue(false);

    const res = await uploadFiles(token, product._id);

    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/Cloudinary/);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('rejects files that are not images', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;

    const res = await api()
      .post(`/api/admin/products/${product._id}/images`)
      .set(authHeader(token))
      .attach('images', Buffer.from('%PDF'), { filename: 'a.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('rejects an upload with no files', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;

    const res = await api()
      .post(`/api/admin/products/${product._id}/images`)
      .set(authHeader(token));
    expect(res.status).toBe(400);
  });

  it('cleans up and fails when one of several uploads fails', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;
    uploadImage
      .mockResolvedValueOnce({ url: 'https://img.test/ok.jpg', publicId: 'products/ok' })
      .mockRejectedValueOnce(new Error('network'));

    const res = await uploadFiles(token, product._id, 2);

    expect(res.status).toBe(502);
    expect(deleteImage).toHaveBeenCalledWith('products/ok');
    const saved = await api().get(`/api/admin/products/${product._id}`).set(authHeader(token));
    expect(saved.body.data.images).toHaveLength(0);
  });

  it('reorders images, edits alt text and removes an image', async () => {
    const token = await asAdmin();
    const product = (await createProduct(token)).body.data;
    const [a, b] = (await uploadFiles(token, product._id, 2)).body.data.images;

    const reordered = await api()
      .put(`/api/admin/products/${product._id}`)
      .set(authHeader(token))
      .send({
        images: [
          { _id: b._id, alt: 'Back view' },
          { _id: a._id, alt: 'Front view' },
        ],
      });
    expect(reordered.status).toBe(200);
    expect(reordered.body.data.images.map((image) => image.alt)).toEqual([
      'Back view',
      'Front view',
    ]);

    const incomplete = await api()
      .put(`/api/admin/products/${product._id}`)
      .set(authHeader(token))
      .send({ images: [{ _id: a._id, alt: '' }] });
    expect(incomplete.status).toBe(400);

    const removed = await api()
      .delete(`/api/admin/products/${product._id}/images/${a._id}`)
      .set(authHeader(token));
    expect(removed.status).toBe(200);
    expect(removed.body.data.images.map((image) => image._id)).toEqual([b._id]);
    expect(deleteImage).toHaveBeenCalledWith(a.publicId);
  });
});

describe('public products', () => {
  it('only shows active products', async () => {
    const token = await asAdmin();
    await createProduct(token);
    await createProduct(token, { ...shirt, title: 'Hidden', status: 'draft' });

    const list = await api().get('/api/products');
    const draft = await api().get('/api/products/hidden');
    const active = await api().get('/api/products/linen-shirt');

    expect(list.body.data.map((p) => p.title)).toEqual(['Linen Shirt']);
    expect(draft.status).toBe(404);
    expect(active.status).toBe(200);
  });

  it('filters by category slug and sorts by price', async () => {
    const token = await asAdmin();
    const bags = (
      await api().post('/api/admin/categories').set(authHeader(token)).send({ name: 'Bags' })
    ).body.data;
    const bag = (price, title) =>
      createProduct(token, {
        title,
        status: 'active',
        category: bags._id,
        variants: [{ price, stock: 1 }],
      });
    await bag(80, 'Backpack');
    await bag(30, 'Tote');
    await createProduct(token);

    const cheapest = await api().get('/api/products?category=bags&sort=price-asc');
    const unknown = await api().get('/api/products?category=nope');

    expect(cheapest.body.data.map((p) => p.title)).toEqual(['Tote', 'Backpack']);
    expect(cheapest.body.data[0].category).toMatchObject({ name: 'Bags', slug: 'bags' });
    expect(unknown.body.data).toEqual([]);
  });

  it('searches part of the product name or its category name, ignoring case', async () => {
    const token = await asAdmin();
    const bags = (
      await api().post('/api/admin/categories').set(authHeader(token)).send({ name: 'Bags' })
    ).body.data;
    await createProduct(token, {
      title: 'Tote',
      status: 'active',
      category: bags._id,
      variants: [{ price: 30, stock: 1 }],
    });
    await createProduct(token, {
      title: 'Hidden Bag',
      status: 'draft',
      variants: [{ price: 30, stock: 1 }],
    });
    await createProduct(token);

    const titles = async (q) =>
      (await api().get(`/api/products?q=${encodeURIComponent(q)}`)).body.data.map((p) => p.title);

    expect(await titles('lin')).toEqual(['Linen Shirt']);
    expect(await titles('LIN')).toEqual(['Linen Shirt']);
    expect(await titles('bag')).toEqual(['Tote']);
    expect(await titles('(')).toEqual([]);
  });

  it('ignores bad query values instead of failing', async () => {
    const res = await api().get('/api/products?page=-3&limit=9999&sort=evil&q[$ne]=x');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 24 });
  });
});
