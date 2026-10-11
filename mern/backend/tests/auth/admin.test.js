import { describe, expect, it } from 'vitest';
import User from '../../src/models/user.model.js';
import seedAdmin from '../../src/utils/auth/seedAdmin.js';
import { api, createUser, getTokenFromResponse } from '../helpers.js';

// ADMIN_EMAIL and ADMIN_PASSWORD come from vitest.config.js
const OWNER = { email: 'owner@example.com', password: 'owner-password-123' };

describe('POST /api/auth/admin/login', () => {
  it('starts a session for an admin', async () => {
    await createUser({ email: 'boss@example.com', role: 'admin' });

    const res = await api()
      .post('/api/auth/admin/login')
      .send({ email: 'boss@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
    expect(getTokenFromResponse(res)).toBeTypeOf('string');
  });

  it('turns customers away with the same message as a wrong password', async () => {
    await createUser({ email: 'shopper@example.com' });

    const customer = await api()
      .post('/api/auth/admin/login')
      .send({ email: 'shopper@example.com', password: 'secret123' });
    const wrong = await api()
      .post('/api/auth/admin/login')
      .send({ email: 'shopper@example.com', password: 'nope-nope' });

    expect(customer.status).toBe(401);
    expect(getTokenFromResponse(customer)).toBeUndefined();
    expect(customer.body.message).toBe(wrong.body.message);
  });
});

describe('seedAdmin', () => {
  const login = () => api().post('/api/auth/admin/login').send(OWNER);

  it('creates the admin account from the environment', async () => {
    await seedAdmin();

    const res = await login();
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: OWNER.email, role: 'admin' });
  });

  it('does nothing when the account already matches', async () => {
    await seedAdmin();
    const before = await User.findOne({ email: OWNER.email }).select('+password');

    await seedAdmin();
    const after = await User.findOne({ email: OWNER.email }).select('+password');

    expect(after.password).toBe(before.password);
    expect(await User.countDocuments()).toBe(1);
  });

  it('restores the role and password when they were changed', async () => {
    await createUser({ email: OWNER.email, password: 'something-else' });

    await seedAdmin();

    const res = await login();
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
  });
});
