import { describe, expect, it } from 'vitest';
import { api, authHeader, createUser } from '../helpers.js';

const createCategory = (token, body) =>
  api().post('/api/admin/categories').set(authHeader(token)).send(body);

describe('categories', () => {
  it('only lets admins manage categories', async () => {
    const { token } = await createUser();

    const anonymous = await api().post('/api/admin/categories').send({ name: 'Bags' });
    const customer = await createCategory(token, { name: 'Bags' });

    expect(anonymous.status).toBe(401);
    expect(customer.status).toBe(403);
  });

  it('creates categories with unique slugs and lists them publicly', async () => {
    const { token } = await createUser({ role: 'admin' });

    const first = await createCategory(token, { name: "Men's Shirts" });
    await createCategory(token, { name: 'Bags' });

    expect(first.status).toBe(201);
    expect(first.body.data.slug).toBe('mens-shirts');

    const list = await api().get('/api/categories');
    expect(list.status).toBe(200);
    expect(list.body.data.map((category) => category.name)).toEqual(['Bags', "Men's Shirts"]);
  });

  it('rejects a duplicate name and keeps the slug when renaming', async () => {
    const { token } = await createUser({ role: 'admin' });
    const created = await createCategory(token, { name: 'Bags' });

    const duplicate = await createCategory(token, { name: 'bags' });
    expect(duplicate.status).toBe(409);

    const renamed = await api()
      .put(`/api/admin/categories/${created.body.data._id}`)
      .set(authHeader(token))
      .send({ name: 'Handbags' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data).toMatchObject({ name: 'Handbags', slug: 'bags' });
  });

  it('refuses to delete a category that still has products', async () => {
    const { token } = await createUser({ role: 'admin' });
    const category = (await createCategory(token, { name: 'Bags' })).body.data;

    await api()
      .post('/api/admin/products')
      .set(authHeader(token))
      .send({ title: 'Tote', category: category._id, variants: [{ price: 10, stock: 1 }] });

    const blocked = await api()
      .delete(`/api/admin/categories/${category._id}`)
      .set(authHeader(token));
    expect(blocked.status).toBe(409);
  });

  it('deletes an empty category', async () => {
    const { token } = await createUser({ role: 'admin' });
    const category = (await createCategory(token, { name: 'Bags' })).body.data;

    const deleted = await api()
      .delete(`/api/admin/categories/${category._id}`)
      .set(authHeader(token));
    const missing = await api()
      .delete(`/api/admin/categories/${category._id}`)
      .set(authHeader(token));

    expect(deleted.status).toBe(200);
    expect(missing.status).toBe(404);
  });
});
