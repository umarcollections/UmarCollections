import { describe, expect, it } from 'vitest';
import Discount from '../../src/models/discount.model.js';
import Product from '../../src/models/product.model.js';
import Settings from '../../src/models/settings.model.js';
import { cancelUnpaidOrders } from '../../src/utils/orders/cancelUnpaidOrders.js';
import { api, authHeader, createUser } from '../helpers.js';

const BANK = { bankName: 'Meezan Bank', accountTitle: 'Store Owner', accountNumber: '0101' };
const customer = {
  customer: { name: 'Ali Raza', email: 'ali@example.com', phone: '0300 1234567' },
  shippingAddress: { address: 'House 5, Street 9', city: 'Lahore' },
};

// A 2000 bag with plenty of stock, shipping 250, free shipping from 5000
const setup = async () => {
  await Settings.create({ bankAccounts: [BANK], shippingFee: 250, freeShippingThreshold: 5000 });
  const product = await Product.create({
    title: 'Leather Bag',
    slug: 'leather-bag',
    status: 'active',
    variants: [{ price: 2000, stock: 50 }],
  });
  const items = (quantity) => [
    { productId: product.id, variantId: product.variants[0].id, quantity },
  ];
  const { token } = await createUser({ role: 'admin' });
  const createDiscount = (body) =>
    api()
      .post('/api/admin/discounts')
      .set(authHeader(token))
      .send({ type: 'percentage', value: 10, ...body });
  const quote = (quantity, discountCode) =>
    api()
      .post('/api/orders/quote')
      .send({ items: items(quantity), discountCode });
  const order = (quantity, discountCode) =>
    api()
      .post('/api/orders')
      .send({ ...customer, items: items(quantity), discountCode });
  return { token, createDiscount, quote, order };
};

describe('admin discounts', () => {
  it('is admin only', async () => {
    const { token } = await createUser();
    const res = await api().get('/api/admin/discounts').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it('creates codes in capitals and rejects duplicates and bad values', async () => {
    const { createDiscount } = await setup();

    const created = await createDiscount({ code: 'summer10' });
    const duplicate = await createDiscount({ code: 'SUMMER10' });
    const tooMuch = await createDiscount({ code: 'HALF', value: 150 });
    const nothing = await createDiscount({ code: 'ZERO', type: 'fixed', value: 0 });
    const badCode = await createDiscount({ code: 'no spaces!' });

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ code: 'SUMMER10', usedCount: 0, active: true });
    expect([duplicate.status, tooMuch.status, nothing.status, badCode.status]).toEqual([
      409, 400, 400, 400,
    ]);
  });

  it('updates and deletes a code without touching its use count', async () => {
    const { token, createDiscount } = await setup();
    const { _id } = (await createDiscount({ code: 'SALE' })).body.data;
    await Discount.updateOne({ _id }, { usedCount: 3 });

    const updated = await api()
      .put(`/api/admin/discounts/${_id}`)
      .set(authHeader(token))
      .send({ code: 'SALE', type: 'fixed', value: 500, usedCount: 0, active: false });
    const deleted = await api().delete(`/api/admin/discounts/${_id}`).set(authHeader(token));

    expect(updated.body.data).toMatchObject({
      type: 'fixed',
      value: 500,
      active: false,
      usedCount: 3,
    });
    expect(deleted.status).toBe(200);
  });
});

describe('discounts at checkout', () => {
  it('takes a percentage off the subtotal', async () => {
    const { createDiscount, quote } = await setup();
    await createDiscount({ code: 'TEN', value: 10 });

    const res = await quote(2, 'ten');

    expect(res.body.data).toMatchObject({
      subtotal: 4000,
      discount: { code: 'TEN', amount: 400 },
      discountError: null,
      shippingFee: 250,
      total: 3850,
    });
  });

  it('never takes off more than the subtotal and judges free shipping after the discount', async () => {
    const { createDiscount, quote } = await setup();
    await createDiscount({ code: 'BIG', type: 'fixed', value: 99999 });
    await createDiscount({ code: 'SMALL', type: 'fixed', value: 500 });
    await createDiscount({ code: 'LARGE', type: 'fixed', value: 1500 });

    const big = await quote(1, 'BIG');
    // 3 x 2000 = 6000, minus 500 = 5500: still at or above 5000, ships free
    const small = await quote(3, 'SMALL');
    // 6000 minus 1500 = 4500: below 5000 after the discount, so shipping is charged
    const large = await quote(3, 'LARGE');

    expect(big.body.data).toMatchObject({ discount: { amount: 2000 }, total: 250 });
    expect(small.body.data).toMatchObject({ shippingFee: 0, total: 5500 });
    expect(large.body.data).toMatchObject({ subtotal: 6000, shippingFee: 250, total: 4750 });
  });

  it('explains why a code does not apply', async () => {
    const { createDiscount, quote } = await setup();
    await createDiscount({ code: 'OLD', expiresAt: '2020-01-01T00:00:00.000Z' });
    await createDiscount({ code: 'OFF', active: false });
    await createDiscount({ code: 'MIN', minSubtotal: 5000 });

    const messages = await Promise.all(
      ['NOPE', 'OLD', 'OFF', 'MIN'].map(async (code) => (await quote(1, code)).body.data)
    );

    expect(messages.map((data) => data.discountError.message)).toEqual([
      'This code is not valid',
      'This code has expired',
      'This code is not valid',
      'Spend 5000 or more to use this code',
    ]);
    expect(messages[3].discountError.minSubtotal).toBe(5000);
    messages.forEach((data) => expect(data).toMatchObject({ discount: null, total: 2250 }));
  });

  it('records the discount on the order and refuses an order with a bad code', async () => {
    const { createDiscount, order } = await setup();
    await createDiscount({ code: 'TEN' });

    const good = await order(1, 'TEN');
    const bad = await order(1, 'NOPE');

    expect(good.body.data.order).toMatchObject({
      subtotal: 2000,
      discount: { code: 'TEN', amount: 200 },
      total: 2050,
    });
    expect(bad.status).toBe(409);
    expect(bad.body.message).toBe('Discount code: This code is not valid');
  });

  it('never goes past the usage limit, even with orders at the same moment', async () => {
    const { createDiscount, order } = await setup();
    await createDiscount({ code: 'ONCE', usageLimit: 1 });

    const results = await Promise.all([order(1, 'ONCE'), order(1, 'ONCE'), order(1, 'ONCE')]);

    expect(results.map((res) => res.status).sort()).toEqual([201, 409, 409]);
    expect((await Discount.findOne({ code: 'ONCE' })).usedCount).toBe(1);
    expect(await Product.findOne().then((p) => p.variants[0].stock)).toBe(49);
  });

  it('gives the use back when the order is cancelled or expires', async () => {
    const { token, createDiscount, order } = await setup();
    await createDiscount({ code: 'ONCE', usageLimit: 1 });

    const first = (await order(1, 'ONCE')).body.data.order;
    await api()
      .post(`/api/admin/orders/${first._id}/actions`)
      .set(authHeader(token))
      .send({ action: 'cancel' });
    expect((await Discount.findOne({ code: 'ONCE' })).usedCount).toBe(0);

    expect((await order(1, 'ONCE')).status).toBe(201);
    await cancelUnpaidOrders(new Date(Date.now() + 100 * 60 * 60 * 1000));
    expect((await Discount.findOne({ code: 'ONCE' })).usedCount).toBe(0);
  });
});
