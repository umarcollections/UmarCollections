import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import Product from '../../src/models/product.model.js';
import Settings from '../../src/models/settings.model.js';
import User from '../../src/models/user.model.js';
import { api, authHeader, createUser } from '../helpers.js';

const CSRF = { 'X-Requested-With': 'XMLHttpRequest' };

const HOME = {
  label: 'Home',
  name: 'Ayesha Khan',
  phone: '0300 1234567',
  address: 'House 12, Street 4, Gulberg',
  city: 'Faisalabad',
};
const OFFICE = { ...HOME, label: 'Office', address: 'Office 3, Kohinoor Plaza' };

const add = (token, body) => api().post('/api/account/addresses').set(authHeader(token)).send(body);

describe('profile', () => {
  it('updates name and phone, but not email or role', async () => {
    const { token, user } = await createUser();
    const res = await api()
      .patch('/api/account/profile')
      .set(authHeader(token))
      .send({ name: 'Ayesha Khan', phone: '+92 300 1234567', email: 'x@y.z', role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Ayesha Khan', phone: '+92 300 1234567' });
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.role).toBe('user');
  });

  it('rejects a bad phone and needs a login', async () => {
    const { token } = await createUser();
    const bad = await api()
      .patch('/api/account/profile')
      .set(authHeader(token))
      .send({ name: 'A', phone: 'call me' });
    const guest = await api().patch('/api/account/profile').send({ name: 'A' });

    expect(bad.status).toBe(400);
    expect(guest.status).toBe(401);
  });
});

describe('address book', () => {
  it('makes the first address the default, and moves the default on request', async () => {
    const { token } = await createUser();
    const first = await add(token, HOME);
    const second = await add(token, OFFICE);

    expect(first.status).toBe(201);
    const [home, office] = second.body.data.addresses;
    expect([home.isDefault, office.isDefault]).toEqual([true, false]);

    const moved = await api()
      .post(`/api/account/addresses/${office._id}/default`)
      .set(authHeader(token));
    expect(moved.body.data.addresses.map((a) => a.isDefault)).toEqual([false, true]);

    const third = await add(token, { ...HOME, address: 'House 9, Street 1', isDefault: true });
    expect(third.body.data.addresses.filter((a) => a.isDefault)).toHaveLength(1);
    expect(third.body.data.addresses.at(-1).isDefault).toBe(true);
  });

  it('edits and deletes, passing the default on when it is deleted', async () => {
    const { token } = await createUser();
    await add(token, HOME);
    const { addresses } = (await add(token, OFFICE)).body.data;

    const edited = await api()
      .put(`/api/account/addresses/${addresses[1]._id}`)
      .set(authHeader(token))
      .send({ ...OFFICE, address: 'Office 7, Kohinoor Plaza' });
    expect(edited.body.data.addresses[1].address).toBe('Office 7, Kohinoor Plaza');

    const deleted = await api()
      .delete(`/api/account/addresses/${addresses[0]._id}`)
      .set(authHeader(token));
    expect(deleted.body.data.addresses).toHaveLength(1);
    expect(deleted.body.data.addresses[0].isDefault).toBe(true);
  });

  it('allows five addresses and checks each one like checkout does', async () => {
    const { token } = await createUser();
    for (let i = 0; i < 5; i += 1) await add(token, { ...HOME, address: `House ${i}, Street 4` });

    const sixth = await add(token, OFFICE);
    const bad = await add(token, { ...HOME, address: 'x' });
    expect(sixth.status).toBe(400);
    expect(sixth.body.message).toMatch(/up to 5/);
    expect(bad.status).toBe(400);
  });

  it("can't touch another customer's address", async () => {
    const owner = await createUser();
    const other = await createUser();
    const [address] = (await add(owner.token, HOME)).body.data.addresses;

    const res = await api()
      .delete(`/api/account/addresses/${address._id}`)
      .set(authHeader(other.token));
    expect(res.status).toBe(404);
  });
});

describe('change password', () => {
  const loggedIn = async () => {
    const { user } = await createUser();
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .set(CSRF)
      .send({ email: user.email, password: 'secret123' });
    return { user, agent };
  };

  it('changes it, keeps this device signed in and signs out the others', async () => {
    const { user, agent } = await loggedIn();
    const other = request.agent(app);
    await other
      .post('/api/auth/login')
      .set(CSRF)
      .send({ email: user.email, password: 'secret123' });

    const res = await agent
      .post('/api/account/password')
      .set(CSRF)
      .send({ currentPassword: 'secret123', newPassword: 'brand-new-pass' });

    expect(res.status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await other.get('/api/auth/me')).status).toBe(401);
    const login = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: 'brand-new-pass' });
    expect(login.status).toBe(200);
  });

  it('answers a wrong current password with a 400, so the session stays', async () => {
    const { agent } = await loggedIn();
    const res = await agent
      .post('/api/account/password')
      .set(CSRF)
      .send({ currentPassword: 'wrong-one', newPassword: 'brand-new-pass' });

    expect(res.status).toBe(400);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });
});

describe('saving the address at checkout', () => {
  const order = async (token, extra) => {
    if (!(await Settings.exists({}))) {
      await Settings.create({
        bankAccounts: [{ bankName: 'Meezan Bank', accountTitle: 'Owner', accountNumber: '0101' }],
      });
    }
    const product =
      (await Product.findOne({ slug: 'wool-scarf' })) ??
      (await Product.create({
        title: 'Wool Scarf',
        slug: 'wool-scarf',
        status: 'active',
        variants: [{ price: 3200, stock: 20 }],
      }));
    return api()
      .post('/api/orders')
      .set(authHeader(token))
      .send({
        items: [{ productId: product.id, variantId: product.variants[0].id, quantity: 1 }],
        customer: { name: HOME.name, email: 'ayesha@example.com', phone: HOME.phone },
        shippingAddress: { address: HOME.address, city: HOME.city },
        ...extra,
      });
  };

  it('saves it once when asked, as the default, and fills in a missing phone', async () => {
    const { token, user } = await createUser();
    expect((await order(token, { saveAddress: true })).status).toBe(201);
    await order(token, { saveAddress: true });

    const saved = await User.findById(user._id);
    expect(saved.addresses).toHaveLength(1);
    expect(saved.addresses[0]).toMatchObject({ address: HOME.address, isDefault: true });
    expect(saved.phone).toBe(HOME.phone);
  });

  it("doesn't save it unless asked", async () => {
    const { token, user } = await createUser();
    await order(token);
    expect((await User.findById(user._id)).addresses).toHaveLength(0);
  });
});
