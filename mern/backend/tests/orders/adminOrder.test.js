import { beforeEach, describe, expect, it, vi } from 'vitest';
import Product from '../../src/models/product.model.js';
import Settings from '../../src/models/settings.model.js';
import { deleteImage, isImageStorageReady, uploadImage } from '../../src/utils/imageStorage.js';
import { api, authHeader, createUser } from '../helpers.js';

vi.mock('../../src/utils/imageStorage.js', () => ({
  isImageStorageReady: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

const BANK = { bankName: 'Meezan Bank', accountTitle: 'Store Owner', accountNumber: '0101' };

// Places a guest order for 2 of a variant with 5 in stock; returns what tests need
const setup = async () => {
  await Settings.create({ bankAccounts: [BANK], paymentWindowHours: 24 });
  const product = await Product.create({
    title: 'Wool Scarf',
    slug: 'wool-scarf',
    status: 'active',
    variants: [{ price: 1500, stock: 5 }],
  });
  const variant = product.variants[0];
  const { order, key } = (
    await api()
      .post('/api/orders')
      .send({
        items: [{ productId: product.id, variantId: variant.id, quantity: 2 }],
        customer: { name: 'Sara Ahmed', email: 'sara@example.com', phone: '0321 5550000' },
        shippingAddress: { address: 'Flat 3, Block B', city: 'Karachi' },
      })
  ).body.data;
  const { token } = await createUser({ role: 'admin' });

  const act = (body) =>
    api().post(`/api/admin/orders/${order._id}/actions`).set(authHeader(token)).send(body);
  const pay = () =>
    api()
      .post(`/api/orders/${order.orderNumber}/payment?key=${key}`)
      .field('reference', 'TRX-42')
      .attach('screenshot', Buffer.from('img'), { filename: 'p.png', contentType: 'image/png' });
  const stock = async () => (await Product.findById(product.id)).variants[0].stock;

  return { order, key, token, act, pay, stock };
};

beforeEach(() => {
  isImageStorageReady.mockReset().mockReturnValue(true);
  uploadImage
    .mockReset()
    .mockResolvedValue({ url: 'https://img.test/p.png', publicId: 'payments/p' });
  deleteImage.mockReset().mockResolvedValue({});
});

describe('admin orders', () => {
  it('is admin only', async () => {
    const { token } = await createUser();
    const res = await api().get('/api/admin/orders').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it('lists and searches orders by number, name, email or phone', async () => {
    const { order, token } = await setup();
    const search = (q) =>
      api()
        .get(`/api/admin/orders?q=${encodeURIComponent(q)}`)
        .set(authHeader(token));

    for (const q of [String(order.orderNumber), 'sara', 'SARA@example', '0321']) {
      const res = await search(q);
      expect(
        res.body.data.map((o) => o.orderNumber),
        q
      ).toEqual([order.orderNumber]);
    }
    expect((await search('nobody')).body.data).toEqual([]);

    const filtered = await api().get('/api/admin/orders?status=confirmed').set(authHeader(token));
    expect(filtered.body.data).toEqual([]);
  });

  it('confirms a submitted payment, ships with tracking, then delivers', async () => {
    const { act, pay } = await setup();
    await pay();

    const confirmed = await act({ action: 'confirm_payment' });
    const shipped = await act({ action: 'ship', courier: 'TCS', trackingNumber: '77001' });
    const delivered = await act({ action: 'deliver' });

    expect(confirmed.body.data.status).toBe('confirmed');
    expect(confirmed.body.data.payment.confirmedAt).toBeTypeOf('string');
    expect(shipped.body.data.shipment).toMatchObject({ courier: 'TCS', trackingNumber: '77001' });
    expect(delivered.body.data.status).toBe('delivered');
    expect(delivered.body.data.history.map((h) => h.status)).toEqual([
      'awaiting_payment',
      'payment_submitted',
      'confirmed',
      'shipped',
      'delivered',
    ]);
  });

  it('can confirm a payment the customer never reported', async () => {
    const { act } = await setup();
    const res = await act({ action: 'confirm_payment' });
    expect(res.body.data.status).toBe('confirmed');
  });

  it('rejects a payment with a reason, reopens it and lets the customer pay again', async () => {
    const { order, key, act, pay } = await setup();
    await pay();

    const missingReason = await act({ action: 'reject_payment' });
    const rejected = await act({ action: 'reject_payment', note: 'No transfer found for TRX-42' });

    expect(missingReason.status).toBe(400);
    expect(rejected.body.data).toMatchObject({
      status: 'awaiting_payment',
      payment: { rejectionNote: 'No transfer found for TRX-42' },
    });
    expect(new Date(rejected.body.data.paymentDueAt).getTime()).toBeGreaterThan(
      new Date(order.paymentDueAt).getTime() - 1
    );
    expect(deleteImage).toHaveBeenCalledWith('payments/p');

    const customerView = await api().get(`/api/orders/${order.orderNumber}?key=${key}`);
    expect(customerView.body.data.payment.rejectionNote).toBe('No transfer found for TRX-42');
    expect((await pay()).status).toBe(200);
  });

  it('cancels with a reason and returns the stock exactly once', async () => {
    const { act, stock } = await setup();
    expect(await stock()).toBe(3);

    const cancelled = await act({ action: 'cancel', note: 'Customer asked to cancel' });
    const again = await act({ action: 'cancel' });

    expect(cancelled.body.data.status).toBe('cancelled');
    expect(cancelled.body.data.history.at(-1).note).toBe('Customer asked to cancel');
    expect(again.status).toBe(409);
    expect(await stock()).toBe(5);
  });

  it('refuses actions that do not fit the current status', async () => {
    const { act } = await setup();

    const shipUnpaid = await act({ action: 'ship' });
    const rejectUnsubmitted = await act({ action: 'reject_payment', note: 'Nothing sent' });
    await act({ action: 'confirm_payment' });
    await act({ action: 'ship' });
    const cancelShipped = await act({ action: 'cancel' });
    const unknown = await act({ action: 'refund' });

    expect(shipUnpaid.status).toBe(409);
    expect(shipUnpaid.body.message).toBe(
      "This order is awaiting payment, so that can't be done now"
    );
    expect(rejectUnsubmitted.status).toBe(409);
    expect(cancelShipped.status).toBe(409);
    expect(unknown.status).toBe(400);
  });

  it('applies one of two simultaneous cancels', async () => {
    const { act, stock } = await setup();

    const results = await Promise.all([act({ action: 'cancel' }), act({ action: 'cancel' })]);

    expect(results.map((res) => res.status).sort()).toEqual([200, 409]);
    expect(await stock()).toBe(5);
  });

  it('returns 404 for an unknown order', async () => {
    const { token } = await setup();
    const res = await api()
      .post('/api/admin/orders/000000000000000000000000/actions')
      .set(authHeader(token))
      .send({ action: 'deliver' });
    expect(res.status).toBe(404);
  });
});
