import { describe, expect, it } from 'vitest';
import Product from '../../src/models/product.model.js';
import Settings from '../../src/models/settings.model.js';
import { api, authHeader, createUser } from '../helpers.js';

const setup = async () => {
  await Settings.create({
    bankAccounts: [{ bankName: 'Meezan Bank', accountTitle: 'Owner', accountNumber: '0101' }],
  });
  const product = await Product.create({
    title: 'Denim Jacket',
    slug: 'denim-jacket',
    status: 'active',
    variants: [{ price: 6000, stock: 10 }],
  });
  return (token) => {
    const req = api()
      .post('/api/orders')
      .send({
        items: [{ productId: product.id, variantId: product.variants[0].id, quantity: 1 }],
        customer: { name: 'Hina', email: 'hina@example.com', phone: '0300 1234567' },
        shippingAddress: { address: 'House 2, Street 3', city: 'Lahore' },
      });
    return token ? req.set(authHeader(token)) : req;
  };
};

describe('customer accounts and orders', () => {
  it('lists only the orders placed while signed in to this account', async () => {
    const order = await setup();
    const { token } = await createUser();
    const { token: otherToken } = await createUser();
    await order(token);
    await order(otherToken);
    await order();

    const res = await api().get('/api/orders/mine').set(authHeader(token));
    const anonymous = await api().get('/api/orders/mine');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].accessKeyHash).toBeUndefined();
    expect(anonymous.status).toBe(401);
  });

  it('lets the owner open and pay their order without the private key', async () => {
    const order = await setup();
    const { token } = await createUser();
    const { token: otherToken } = await createUser();
    const { orderNumber } = (await order(token)).body.data.order;

    const owner = await api().get(`/api/orders/${orderNumber}`).set(authHeader(token));
    const stranger = await api().get(`/api/orders/${orderNumber}`).set(authHeader(otherToken));
    const guest = await api().get(`/api/orders/${orderNumber}`);
    const paid = await api()
      .post(`/api/orders/${orderNumber}/payment`)
      .set(authHeader(token))
      .field('reference', 'TRX-5');

    expect(owner.status).toBe(200);
    expect([stranger.status, guest.status]).toEqual([404, 404]);
    expect(paid.body.data.status).toBe('payment_submitted');
  });
});
