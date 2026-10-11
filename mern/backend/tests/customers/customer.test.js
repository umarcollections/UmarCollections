import { describe, expect, it } from 'vitest';
import Product from '../../src/models/product.model.js';
import Settings from '../../src/models/settings.model.js';
import { api, authHeader, createUser } from '../helpers.js';

const BANK = { bankName: 'Meezan Bank', accountTitle: 'Store Owner', accountNumber: '0101' };

const setup = async () => {
  await Settings.create({ bankAccounts: [BANK] });
  const product = await Product.create({
    title: 'Cotton Shirt',
    slug: 'cotton-shirt',
    status: 'active',
    variants: [{ price: 1000, stock: 50 }],
  });
  const { token } = await createUser({ role: 'admin' });

  const order = (person, quantity = 1, auth) => {
    const req = api()
      .post('/api/orders')
      .send({
        items: [{ productId: product.id, variantId: product.variants[0].id, quantity }],
        customer: person,
        shippingAddress: { address: 'House 1, Street 1', city: person.city ?? 'Lahore' },
      });
    return auth ? req.set(authHeader(auth)) : req;
  };
  const confirm = (id) =>
    api()
      .post(`/api/admin/orders/${id}/actions`)
      .set(authHeader(token))
      .send({ action: 'confirm_payment' });
  const get = (path) => api().get(`/api/admin/customers${path}`).set(authHeader(token));

  return { order, confirm, get };
};

const ayesha = { name: 'Ayesha', email: 'ayesha@example.com', phone: '0300 1111111' };
const bilal = { name: 'Bilal', email: 'bilal@example.com', phone: '0300 2222222' };

describe('admin customers', () => {
  it('is admin only', async () => {
    const { token } = await createUser();
    const res = await api().get('/api/admin/customers').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  it('groups orders by email and only counts confirmed payments as paid', async () => {
    const { order, confirm, get } = await setup();
    const first = (await order(ayesha, 2)).body.data.order;
    await order({ ...ayesha, email: 'AYESHA@example.com', name: 'Ayesha K' });
    await order(bilal);
    await confirm(first._id);

    const res = await get('');

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(2);
    const row = res.body.data.find((c) => c.email === 'ayesha@example.com');
    expect(row).toMatchObject({ name: 'Ayesha K', orders: 2, paid: 2000, registered: false });
  });

  it('marks customers who ordered while signed in', async () => {
    const { order, get } = await setup();
    const { token } = await createUser({ email: 'member@example.com' });
    await order({ ...bilal, email: 'member@example.com' }, 1, token);

    const res = await get('');
    expect(res.body.data[0]).toMatchObject({ email: 'member@example.com', registered: true });
  });

  it('searches by name, email or phone', async () => {
    const { order, get } = await setup();
    await order(ayesha);
    await order(bilal);

    for (const q of ['ayes', 'bilal@', '2222']) {
      const res = await get(`?q=${encodeURIComponent(q)}`);
      expect(res.body.data, q).toHaveLength(1);
    }
  });

  it('shows one customer with their orders, newest first', async () => {
    const { order, get } = await setup();
    await order(ayesha, 1);
    await order(ayesha, 3);

    const res = await get(`/${encodeURIComponent('Ayesha@Example.com')}`);
    const missing = await get('/nobody%40example.com');

    expect(res.body.data).toMatchObject({ email: 'ayesha@example.com', orders: 2 });
    expect(res.body.data.orderList.map((o) => o.subtotal)).toEqual([3000, 1000]);
    expect(missing.status).toBe(404);
  });
});
