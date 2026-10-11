import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import env from '../../src/config/env.js';
import Product from '../../src/models/product.model.js';
import Settings from '../../src/models/settings.model.js';
import { deleteImage, isImageStorageReady, uploadImage } from '../../src/utils/imageStorage.js';
import { api } from '../helpers.js';

vi.mock('../../src/utils/imageStorage.js', () => ({
  isImageStorageReady: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

const fetchMock = vi.fn();
const savedAlerts = env.whatsappAlerts;

const placeOrder = async () => {
  await Settings.create({
    bankAccounts: [{ bankName: 'Meezan Bank', accountTitle: 'Owner', accountNumber: '0101' }],
    shippingFee: 250,
  });
  const product = await Product.create({
    title: 'Wool Scarf',
    slug: 'wool-scarf',
    status: 'active',
    options: [{ name: 'Colour', values: ['Rust'] }],
    variants: [{ optionValues: ['Rust'], price: 3200, stock: 5 }],
  });
  return api()
    .post('/api/orders')
    .send({
      items: [{ productId: product.id, variantId: product.variants[0].id, quantity: 1 }],
      customer: { name: 'Ayesha Khan', email: 'ayesha@example.com', phone: '0300 1234567' },
      shippingAddress: { address: 'House 12, Street 4, Gulberg', city: 'Faisalabad' },
    });
};

// The text CallMeBot was asked to send, from the URL of the nth call
const sentText = (n = 0) => new URL(fetchMock.mock.calls[n][0]).searchParams.get('text');

beforeEach(() => {
  env.whatsappAlerts = { phone: '923074801091', apiKey: 'test-key', enabled: true };
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal('fetch', fetchMock);
  isImageStorageReady.mockReset().mockReturnValue(true);
  uploadImage.mockReset().mockResolvedValue({ url: 'https://img.test/p.jpg', publicId: 'p' });
  deleteImage.mockReset().mockResolvedValue({});
});

afterEach(() => {
  env.whatsappAlerts = savedAlerts;
  vi.unstubAllGlobals();
});

describe('WhatsApp alerts to the store owner', () => {
  it('sends the order number, total, customer, items and an admin link for a new order', async () => {
    const res = await placeOrder();

    expect(res.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://api.callmebot.com/whatsapp.php');
    expect(url.searchParams.get('phone')).toBe('923074801091');
    expect(url.searchParams.get('apikey')).toBe('test-key');

    const text = sentText();
    const { order } = res.body.data;
    expect(text).toContain(`New order ${order.orderNumber}: Rs 3,450`);
    expect(text).toContain('Ayesha Khan, 0300 1234567');
    expect(text).toContain('Wool Scarf (Rust) x1');
    expect(text).toMatch(new RegExp(`/admin/orders/${order._id}$`));
  });

  it('sends the reference when the customer sends payment details', async () => {
    const { order, key } = (await placeOrder()).body.data;
    const res = await api()
      .post(`/api/orders/${order.orderNumber}/payment?key=${key}`)
      .field('reference', 'TRX-445566')
      .attach('screenshot', Buffer.from('img'), { filename: 'p.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentText(1)).toContain(`Payment sent for order ${order.orderNumber}: Rs 3,450`);
    expect(sentText(1)).toContain('reference TRX-445566');
  });

  it('still places the order when WhatsApp cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await placeOrder();

    expect(res.status).toBe(201);
    expect(error).toHaveBeenCalledWith('WhatsApp alert failed:', 'network down');
    error.mockRestore();
  });

  it('sends nothing until the CallMeBot key is set', async () => {
    env.whatsappAlerts = { phone: '923074801091', apiKey: undefined, enabled: false };

    const res = await placeOrder();

    expect(res.status).toBe(201);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
