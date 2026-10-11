import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import env from '../../src/config/env.js';
import Order from '../../src/models/order.model.js';
import Product from '../../src/models/product.model.js';
import Settings from '../../src/models/settings.model.js';
import { deleteImage, isImageStorageReady, uploadImage } from '../../src/utils/imageStorage.js';
import { cancelUnpaidOrders } from '../../src/utils/orders/cancelUnpaidOrders.js';
import { api, authHeader, createUser } from '../helpers.js';

vi.mock('../../src/utils/imageStorage.js', () => ({
  isImageStorageReady: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

const fetchMock = vi.fn();
const savedEmail = env.email;

// Every email Resend was asked to send so far, as { to, subject, html, text }
const sentEmails = () =>
  fetchMock.mock.calls
    .filter(([url]) => String(url) === 'https://api.resend.com/emails')
    .map(([, options]) => {
      const body = JSON.parse(options.body);
      return { ...body, to: body.to[0] };
    });

const placeOrder = async (customer = {}) => {
  await Settings.create({
    bankAccounts: [
      { bankName: 'JazzCash', accountTitle: 'Umar Shabir', accountNumber: '03001234567' },
    ],
    shippingFee: 250,
  });
  const product = await Product.create({
    title: 'Wool Scarf',
    slug: 'wool-scarf',
    status: 'active',
    variants: [{ price: 3200, stock: 5 }],
  });
  return api()
    .post('/api/orders')
    .send({
      items: [{ productId: product.id, variantId: product.variants[0].id, quantity: 1 }],
      customer: {
        name: 'Ayesha Khan',
        email: 'ayesha@example.com',
        phone: '0300 1234567',
        ...customer,
      },
      shippingAddress: { address: 'House 12, Street 4, Gulberg', city: 'Faisalabad' },
    });
};

const pay = ({ order, key }) =>
  api()
    .post(`/api/orders/${order.orderNumber}/payment?key=${key}`)
    .field('reference', 'TRX-778899')
    .attach('screenshot', Buffer.from('img'), { filename: 'p.png', contentType: 'image/png' });

beforeEach(() => {
  env.email = {
    apiKey: 're_test',
    from: 'Store <orders@store.test>',
    owner: 'owner@store.test',
    enabled: true,
  };
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  vi.stubGlobal('fetch', fetchMock);
  isImageStorageReady.mockReset().mockReturnValue(true);
  uploadImage.mockReset().mockResolvedValue({ url: 'https://img.test/p.jpg', publicId: 'p' });
  deleteImage.mockReset().mockResolvedValue({});
});

afterEach(() => {
  env.email = savedEmail;
  vi.unstubAllGlobals();
});

describe('order emails', () => {
  it('sends the customer their bank details and private order link, and tells the owner', async () => {
    const res = await placeOrder();
    const { order, key } = res.body.data;

    expect(res.status).toBe(201);
    const [customer, owner] = sentEmails();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer re_test');

    expect(customer.to).toBe('ayesha@example.com');
    expect(customer.from).toBe('Store <orders@store.test>');
    expect(customer.reply_to).toBe('umarcollections.store@gmail.com');
    expect(customer.subject).toBe(
      `Order ${order.orderNumber}: please pay Rs 3,450 by bank transfer`
    );
    expect(customer.html).toContain(`/orders/${order.orderNumber}?key=${key}`);
    expect(customer.html).toContain('JazzCash');
    expect(customer.html).toContain('03001234567');
    expect(customer.text).toContain(`/orders/${order.orderNumber}?key=${key}`);

    expect(owner.to).toBe('owner@store.test');
    expect(owner.subject).toBe(`New order ${order.orderNumber}: Rs 3,450`);
    expect(owner.html).toContain(`/admin/orders/${order._id}`);
    expect(owner.html).not.toContain(key);
  });

  it('escapes what customers type, so it cannot inject HTML', async () => {
    await placeOrder({ name: 'Ali <b onmouseover=alert(1)>' });
    const [customer] = sentEmails();

    expect(customer.html).not.toContain('<b onmouseover');
    expect(customer.html).toContain('Ali &lt;b onmouseover=alert(1)&gt;');
  });

  it('tells the owner when payment details arrive', async () => {
    const placed = (await placeOrder()).body.data;
    await pay(placed);

    const ownerEmail = sentEmails().at(-1);
    expect(ownerEmail.to).toBe('owner@store.test');
    expect(ownerEmail.subject).toBe(
      `Payment to check: order ${placed.order.orderNumber}, Rs 3,450`
    );
    expect(ownerEmail.html).toContain('TRX-778899');
    expect(ownerEmail.html).toContain('https://img.test/p.jpg');
  });

  it('emails the customer for each admin action except delivery', async () => {
    const { token } = await createUser({ role: 'admin' });
    const placed = (await placeOrder()).body.data;
    const n = placed.order.orderNumber;
    const act = (body) =>
      api().post(`/api/admin/orders/${placed.order._id}/actions`).set(authHeader(token)).send(body);
    const lastToCustomer = () =>
      sentEmails()
        .filter((e) => e.to === 'ayesha@example.com')
        .at(-1);

    await pay(placed);
    await act({ action: 'reject_payment', note: 'Amount was Rs 3,000, not Rs 3,450' });
    expect(lastToCustomer().subject).toBe(`Order ${n}: we couldn't match your payment`);
    expect(lastToCustomer().html).toContain('Amount was Rs 3,000, not Rs 3,450');

    await pay(placed);
    await act({ action: 'confirm_payment' });
    expect(lastToCustomer().subject).toBe(`Order ${n}: payment received`);

    await act({ action: 'ship', courier: 'TCS', trackingNumber: 'TCS-123' });
    expect(lastToCustomer().subject).toBe(`Order ${n} is on its way`);
    expect(lastToCustomer().html).toContain('TCS-123');

    const before = sentEmails().length;
    await act({ action: 'deliver' });
    expect(sentEmails()).toHaveLength(before);
  });

  it('tells the customer why their order was cancelled', async () => {
    const { token } = await createUser({ role: 'admin' });
    const placed = (await placeOrder()).body.data;
    await api()
      .post(`/api/admin/orders/${placed.order._id}/actions`)
      .set(authHeader(token))
      .send({ action: 'cancel', note: 'Out of stock' });

    const cancelled = sentEmails().at(-1);
    expect(cancelled.subject).toBe(`Order ${placed.order.orderNumber} has been cancelled`);
    expect(cancelled.text).toContain('Reason: Out of stock');
  });

  it('emails customers whose unpaid order expired', async () => {
    const placed = (await placeOrder()).body.data;
    await cancelUnpaidOrders(new Date(Date.now() + 49 * 60 * 60 * 1000));

    const expired = sentEmails().at(-1);
    expect(expired.to).toBe('ayesha@example.com');
    expect(expired.subject).toBe(`Order ${placed.order.orderNumber} has been cancelled`);
    expect(expired.text).toContain("didn't receive payment in time");
    expect((await Order.findById(placed.order._id)).status).toBe('cancelled');
  });

  it('still places the order when Resend refuses to send', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'You can only send testing emails to your own email address' }),
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await placeOrder();

    expect(res.status).toBe(201);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('failed'),
      'Resend answered 403: You can only send testing emails to your own email address'
    );
    error.mockRestore();
  });

  it('sends nothing until the Resend key is set', async () => {
    env.email = { ...env.email, apiKey: undefined, enabled: false };
    await placeOrder();
    expect(sentEmails()).toHaveLength(0);
  });
});
