import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import env from '../../src/config/env.js';
import User from '../../src/models/user.model.js';
import verifyGoogleToken from '../../src/utils/auth/verifyGoogleToken.js';
import { api, authHeader, createUser, getAuthCookie, getTokenFromResponse } from '../helpers.js';

// The token check itself has its own tests (googleToken.test.js); here Google
// "says" whatever each test needs
vi.mock('../../src/utils/auth/verifyGoogleToken.js', () => ({ default: vi.fn() }));

const profile = (overrides = {}) => ({
  sub: 'google-123',
  email: 'Ayesha@Gmail.com',
  email_verified: true,
  name: 'Ayesha Khan',
  ...overrides,
});
const google = () => api().post('/api/auth/google').send({ credential: 'a-google-id-token' });

const savedGoogle = env.google;
beforeEach(() => {
  env.google = { clientId: 'test-client.apps.googleusercontent.com' };
  verifyGoogleToken.mockReset().mockResolvedValue(profile());
});
afterEach(() => {
  env.google = savedGoogle;
});

describe('POST /api/auth/google', () => {
  it('creates an account for a new customer and signs them in', async () => {
    const res = await google();

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: 'Ayesha Khan',
      email: 'ayesha@gmail.com',
      role: 'user',
      hasPassword: false,
      googleConnected: true,
    });
    expect(res.body.data.googleId).toBeUndefined();
    expect(getAuthCookie(res)).toMatch(/HttpOnly/i);
    expect(verifyGoogleToken).toHaveBeenCalledWith('a-google-id-token');
  });

  it('signs the same person into the same account next time', async () => {
    const first = await google();
    const second = await google();

    expect(second.status).toBe(200);
    expect(second.body.data._id).toBe(first.body.data._id);
    expect(await User.countDocuments({ email: 'ayesha@gmail.com' })).toBe(1);
  });

  it('links Google to an existing password account with the same email', async () => {
    const { user } = await createUser({ email: 'ayesha@gmail.com' });
    const res = await google();

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(user._id);
    expect(res.body.data).toMatchObject({ googleConnected: true, hasPassword: true });
    const login = await api()
      .post('/api/auth/login')
      .send({ email: 'ayesha@gmail.com', password: 'secret123' });
    expect(login.status).toBe(200);
  });

  it('refuses an email Google has not verified', async () => {
    verifyGoogleToken.mockResolvedValue(profile({ email_verified: false }));
    const res = await google();
    expect(res.status).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });

  it('keeps the admin on the admin sign-in', async () => {
    await createUser({ email: 'ayesha@gmail.com', role: 'admin' });
    const res = await google();
    expect(res.status).toBe(403);
    expect(getAuthCookie(res)).toBeUndefined();
  });

  it('answers 503 until a Google client ID is set', async () => {
    env.google = { clientId: undefined };
    expect((await google()).status).toBe(503);
  });
});

describe('Google-only accounts and passwords', () => {
  it("can't log in with a password until they set one, which needs no current password", async () => {
    const token = getTokenFromResponse(await google());
    const before = await api()
      .post('/api/auth/login')
      .send({ email: 'ayesha@gmail.com', password: 'brand-new-pass' });

    const set = await api()
      .post('/api/account/password')
      .set(authHeader(token))
      .send({ newPassword: 'brand-new-pass' });
    const after = await api()
      .post('/api/auth/login')
      .send({ email: 'ayesha@gmail.com', password: 'brand-new-pass' });

    expect(before.status).toBe(401);
    expect(set.status).toBe(200);
    expect(set.body.data.hasPassword).toBe(true);
    expect(after.status).toBe(200);
  });

  it('still need the current password once they have one', async () => {
    const token = getTokenFromResponse(await google());
    await api()
      .post('/api/account/password')
      .set(authHeader(token))
      .send({ newPassword: 'brand-new-pass' });
    const fresh = getTokenFromResponse(
      await api()
        .post('/api/auth/login')
        .send({ email: 'ayesha@gmail.com', password: 'brand-new-pass' })
    );

    const res = await api()
      .post('/api/account/password')
      .set(authHeader(fresh))
      .send({ newPassword: 'another-pass' });
    expect(res.status).toBe(400);
  });

  it('shares the client ID through the public settings', async () => {
    const res = await api().get('/api/settings');
    expect(res.body.data.googleClientId).toBe('test-client.apps.googleusercontent.com');
  });
});
