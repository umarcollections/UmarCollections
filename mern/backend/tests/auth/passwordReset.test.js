import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import env from '../../src/config/env.js';
import User from '../../src/models/user.model.js';
import { api, authHeader, createUser } from '../helpers.js';

const CSRF = { 'X-Requested-With': 'XMLHttpRequest' };
const fetchMock = vi.fn();
const savedEmail = env.email;

const resetEmails = () =>
  fetchMock.mock.calls
    .map(([, options]) => JSON.parse(options.body))
    .filter((e) => e.subject === 'Reset your password');

// The token from the link in the latest reset email
const tokenFromEmail = () =>
  new URL(
    resetEmails()
      .at(-1)
      .text.match(/https?:\/\/\S+/)[0]
  ).searchParams.get('token');

const forgot = (email) => api().post('/api/auth/forgot-password').send({ email });
const reset = (token, password) => api().post('/api/auth/reset-password').send({ token, password });

beforeEach(() => {
  env.email = {
    apiKey: 're_test',
    from: 'Store <orders@store.test>',
    owner: 'owner@store.test',
    enabled: true,
  };
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  env.email = savedEmail;
  vi.unstubAllGlobals();
});

describe('forgot password', () => {
  it('emails a link that sets a new password once', async () => {
    const { user } = await createUser();

    const res = await forgot(user.email.toUpperCase());
    expect(res.status).toBe(200);
    expect(resetEmails()).toHaveLength(1);
    expect(resetEmails()[0].to).toEqual([user.email]);

    const token = tokenFromEmail();
    expect((await reset(token, 'brand-new-pass')).status).toBe(200);
    expect((await reset(token, 'another-pass')).status).toBe(400);

    const oldLogin = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: 'secret123' });
    const newLogin = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: 'brand-new-pass' });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  it('signs out other devices, even ones logged in moments before, but not the new login', async () => {
    const { user, token: before } = await createUser();
    await forgot(user.email);
    await reset(tokenFromEmail(), 'brand-new-pass');

    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .set(CSRF)
      .send({ email: user.email, password: 'brand-new-pass' });

    expect((await api().get('/api/auth/me').set(authHeader(before))).status).toBe(401);
    expect((await api().get('/api/auth/session').set(authHeader(before))).body.data).toBeNull();
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });

  it('gives the same answer for unknown emails and sends nothing', async () => {
    const { user } = await createUser();
    const known = await forgot(user.email);
    fetchMock.mockClear();
    const unknown = await forgot('nobody@example.com');

    expect(unknown.status).toBe(200);
    expect(unknown.body.message).toBe(known.body.message);
    expect(resetEmails()).toHaveLength(0);
  });

  it("doesn't send a second link within two minutes", async () => {
    const { user } = await createUser();
    await forgot(user.email);
    await forgot(user.email);
    expect(resetEmails()).toHaveLength(1);
  });

  it('sends no link for admins, whose password lives in .env', async () => {
    const { user } = await createUser({ role: 'admin' });
    await forgot(user.email);
    expect(resetEmails()).toHaveLength(0);
  });

  it('refuses expired and made-up links, and keeps the token hash private', async () => {
    const { user } = await createUser();
    await forgot(user.email);
    const token = tokenFromEmail();
    await User.updateOne(
      { email: user.email },
      { resetPasswordExpires: new Date(Date.now() - 1000) }
    );

    expect((await reset(token, 'brand-new-pass')).status).toBe(400);
    expect((await reset('made-up', 'brand-new-pass')).status).toBe(400);

    const stored = await User.findOne({ email: user.email }).select('+resetPasswordHash');
    expect(stored.resetPasswordHash).not.toContain(token);
    expect(JSON.stringify(stored.toJSON())).not.toContain('resetPassword');
  });

  it('checks the new password like signup does', async () => {
    const res = await reset('anything', '123');
    expect(res.status).toBe(400);
  });
});
