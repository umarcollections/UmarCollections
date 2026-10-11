import { beforeEach, describe, expect, it, vi } from 'vitest';
import Order from '../../src/models/order.model.js';
import Product from '../../src/models/product.model.js';
import Settings from '../../src/models/settings.model.js';
import { cancelUnpaidOrders } from '../../src/utils/orders/cancelUnpaidOrders.js';
import { reserveStock } from '../../src/utils/orders/stock.js';
import { deleteImage, isImageStorageReady, uploadImage } from '../../src/utils/imageStorage.js';
import { api, authHeader, createUser } from '../helpers.js';

vi.mock('../../src/utils/imageStorage.js', () => ({
  isImageStorageReady: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

const BANK = { bankName: 'Meezan Bank', accountTitle: 'Store Owner', accountNumber: '0101' };

const customer = {
  customer: { name: 'Ayesha Khan', email: 'Ayesha@Example.com', phone: '+92 300 1234567' },
  shippingAddress: { address: 'House 12, Street 4, F-7', city: 'Islamabad' },
};

const openCheckout = (overrides = {}) =>
  Settings.create({ bankAccounts: [BANK], shippingFee: 250, ...overrides });

// A shirt in S (3 left) and M (1 left) at 2000, plus a draft product
const seedProducts = async () => {
  const shirt = await Product.create({
    title: 'Linen Shirt',
    slug: 'linen-shirt',
    status: 'active',
    options: [{ name: 'Size', values: ['S', 'M'] }],
    variants: [
      { optionValues: ['S'], price: 2000, stock: 3, sku: 'LS-S' },
      { optionValues: ['M'], price: 2000, stock: 1 },
    ],
  });
  const draft = await Product.create({
    title: 'Hidden',
    slug: 'hidden',
    status: 'draft',
    variants: [{ price: 10, stock: 5 }],
  });
  const [small, medium] = shirt.variants;
  const item = (variant, quantity = 1, product = shirt) => ({
    productId: product.id,
    variantId: variant.id,
    quantity,
  });
  return { shirt, small, medium, draft, item };
};

const stockOf = async (productId, variantId) =>
  (await Product.findById(productId)).variants.id(variantId).stock;

const placeOrder = (items, extra = {}) =>
  api()
    .post('/api/orders')
    .send({ ...customer, items, ...extra });

beforeEach(() => {
  isImageStorageReady.mockReset().mockReturnValue(true);
  uploadImage
    .mockReset()
    .mockResolvedValue({ url: 'https://img.test/p.jpg', publicId: 'payments/p' });
  deleteImage.mockReset().mockResolvedValue({});
});

describe('POST /api/orders/quote', () => {
  it('prices from the database, merges repeated items and adds shipping', async () => {
    await openCheckout();
    const { small, item } = await seedProducts();

    const res = await api()
      .post('/api/orders/quote')
      .send({ items: [item(small), item(small)] });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      subtotal: 4000,
      shippingFee: 250,
      total: 4250,
      ready: true,
      checkoutOpen: true,
    });
    expect(res.body.data.lines).toHaveLength(1);
    expect(res.body.data.lines[0]).toMatchObject({ quantity: 2, variantLabel: 'S', problem: null });
  });

  it('flags lines that cannot be bought and leaves them out of the total', async () => {
    await openCheckout();
    const { small, medium, draft, item } = await seedProducts();

    const res = await api()
      .post('/api/orders/quote')
      .send({ items: [item(small), item(medium, 2), item(draft.variants[0], 1, draft)] });

    const problems = res.body.data.lines.map((line) => line.problem);
    expect(problems).toEqual([null, 'Only 1 left', 'No longer available']);
    expect(res.body.data).toMatchObject({ subtotal: 2000, ready: false });
  });

  it('ships free at the threshold', async () => {
    await openCheckout({ freeShippingThreshold: 4000 });
    const { small, item } = await seedProducts();

    const res = await api()
      .post('/api/orders/quote')
      .send({ items: [item(small, 2)] });
    expect(res.body.data).toMatchObject({ shippingFee: 0, total: 4000 });
  });
});

describe('POST /api/orders', () => {
  it('refuses orders until a bank account is set up', async () => {
    const { small, item } = await seedProducts();
    const res = await placeOrder([item(small)]);

    expect(res.status).toBe(503);
    expect(await stockOf(small.parent().id, small.id)).toBe(3);
  });

  it('creates an order, reserves stock and returns the private key', async () => {
    await openCheckout();
    const { shirt, small, item } = await seedProducts();

    const res = await placeOrder([item(small, 2)], { price: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.key).toBeTypeOf('string');
    expect(res.body.data.order).toMatchObject({
      orderNumber: 1001,
      status: 'awaiting_payment',
      subtotal: 4000,
      total: 4250,
      customer: { email: 'ayesha@example.com' },
      bankAccounts: [BANK],
    });
    expect(res.body.data.order.items[0]).toMatchObject({ title: 'Linen Shirt', sku: 'LS-S' });
    expect(res.body.data.order.accessKeyHash).toBeUndefined();
    expect(await stockOf(shirt.id, small.id)).toBe(1);

    const next = await placeOrder([item(small)]);
    expect(next.body.data.order.orderNumber).toBe(1002);
  });

  it('rejects an order for more than is in stock', async () => {
    await openCheckout();
    const { medium, item } = await seedProducts();

    const res = await placeOrder([item(medium, 2)]);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Linen Shirt, M: Only 1 left');
  });

  it('sells the last item to only one of two shoppers', async () => {
    await openCheckout();
    const { shirt, medium, item } = await seedProducts();

    const results = await Promise.all([placeOrder([item(medium)]), placeOrder([item(medium)])]);

    expect(results.map((res) => res.status).sort()).toEqual([201, 409]);
    expect(await stockOf(shirt.id, medium.id)).toBe(0);
    expect(await Order.countDocuments()).toBe(1);
  });

  it('links the order to a signed-in customer', async () => {
    await openCheckout();
    const { small, item } = await seedProducts();
    const { user, token } = await createUser();

    const res = await placeOrder([item(small)]).set(authHeader(token));
    expect(res.body.data.order.user).toBe(user._id);
  });

  it('validates the customer details', async () => {
    await openCheckout();
    const { small, item } = await seedProducts();

    const res = await placeOrder([item(small)], {
      customer: { ...customer.customer, phone: 'call me' },
    });
    expect(res.status).toBe(400);
  });
});

describe('reserveStock', () => {
  it('takes nothing when any item is short', async () => {
    const { shirt, small, medium } = await seedProducts();

    const ok = await reserveStock([
      { product: shirt.id, variant: small.id, quantity: 2 },
      { product: shirt.id, variant: medium.id, quantity: 5 },
    ]);

    expect(ok).toBe(false);
    expect(await stockOf(shirt.id, small.id)).toBe(3);
    expect(await stockOf(shirt.id, medium.id)).toBe(1);
  });
});

describe('viewing and paying for an order', () => {
  const setup = async () => {
    await openCheckout();
    const { shirt, small, item } = await seedProducts();
    const { order, key } = (await placeOrder([item(small, 2)])).body.data;
    return { shirt, small, order, key };
  };

  it('needs the key from the order link', async () => {
    const { order, key } = await setup();

    const ok = await api().get(`/api/orders/${order.orderNumber}?key=${key}`);
    const wrongKey = await api().get(`/api/orders/${order.orderNumber}?key=nope`);
    const noKey = await api().get(`/api/orders/${order.orderNumber}`);
    const badNumber = await api().get(`/api/orders/abc?key=${key}`);

    expect(ok.status).toBe(200);
    expect(ok.body.data.orderNumber).toBe(order.orderNumber);
    expect([wrongKey.status, noKey.status, badNumber.status]).toEqual([404, 404, 404]);
  });

  it('accepts a reference and screenshot once', async () => {
    const { order, key } = await setup();
    const url = `/api/orders/${order.orderNumber}/payment?key=${key}`;

    const res = await api()
      .post(url)
      .field('reference', 'TRX-998877')
      .attach('screenshot', Buffer.from('img'), { filename: 'p.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      status: 'payment_submitted',
      payment: { reference: 'TRX-998877', screenshot: { url: 'https://img.test/p.jpg' } },
    });

    const again = await api().post(url).field('reference', 'TRX-1');
    expect(again.status).toBe(409);
  });

  it('accepts a reference alone, and refuses a screenshot while uploads are off', async () => {
    const { order, key } = await setup();
    const url = `/api/orders/${order.orderNumber}/payment?key=${key}`;
    isImageStorageReady.mockReturnValue(false);

    const withFile = await api()
      .post(url)
      .field('reference', 'TRX-1')
      .attach('screenshot', Buffer.from('img'), { filename: 'p.png', contentType: 'image/png' });
    const referenceOnly = await api().post(url).field('reference', 'TRX-1');

    expect(withFile.status).toBe(503);
    expect(referenceOnly.status).toBe(200);
    expect(referenceOnly.body.data.payment.screenshot).toBeNull();
  });

  it('requires a reference', async () => {
    const { order, key } = await setup();
    const res = await api().post(`/api/orders/${order.orderNumber}/payment?key=${key}`);
    expect(res.status).toBe(400);
  });
});

describe('cancelUnpaidOrders', () => {
  it('cancels overdue unpaid orders once and returns their stock', async () => {
    await openCheckout();
    const { shirt, small, item } = await seedProducts();
    const unpaid = (await placeOrder([item(small, 2)])).body.data;
    const paid = (await placeOrder([item(small)])).body.data;
    await api()
      .post(`/api/orders/${paid.order.orderNumber}/payment?key=${paid.key}`)
      .field('reference', 'TRX-1');
    expect(await stockOf(shirt.id, small.id)).toBe(0);

    const later = new Date(Date.now() + 49 * 60 * 60 * 1000);
    const first = await cancelUnpaidOrders(later);
    const second = await cancelUnpaidOrders(later);

    expect([first, second]).toEqual([1, 0]);
    expect((await Order.findById(unpaid.order._id)).status).toBe('cancelled');
    expect((await Order.findById(paid.order._id)).status).toBe('payment_submitted');
    expect(await stockOf(shirt.id, small.id)).toBe(2);
  });

  it('leaves orders that are still inside the payment window', async () => {
    await openCheckout();
    const { small, item } = await seedProducts();
    await placeOrder([item(small)]);

    expect(await cancelUnpaidOrders()).toBe(0);
  });
});
