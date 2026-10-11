import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createUser, getAuthCookie } from '../helpers.js';

const CSRF = { 'X-Requested-With': 'XMLHttpRequest' };

// A supertest agent keeps cookies between requests, like a browser
const loggedInAgent = async ({ role } = {}) => {
  const { user } = await createUser({ role });
  const agent = request.agent(app);
  const res = await agent
    .post('/api/auth/login')
    .set(CSRF)
    .send({ email: user.email, password: 'secret123' });
  return { agent, user, res };
};

describe('cookie session', () => {
  it('sets the token in an httpOnly cookie, not the body', async () => {
    const { res } = await loggedInAgent();
    const cookie = getAuthCookie(res);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Expires=/i);
  });

  it('authenticates requests with the cookie alone', async () => {
    const { agent, user } = await loggedInAgent();
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
    expect(new Date(res.body.session.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('blocks cookie-authenticated writes without the CSRF header', async () => {
    const { agent } = await loggedInAgent({ role: 'admin' });
    const body = { name: 'New', email: 'new@example.com', password: 'secret123' };

    const blocked = await agent.post('/api/users').send(body);
    const allowed = await agent.post('/api/users').set(CSRF).send(body);

    expect(blocked.status).toBe(403);
    expect(allowed.status).toBe(201);
  });

  it('logout clears the cookie and ends the session', async () => {
    const { agent } = await loggedInAgent();

    const res = await agent.post('/api/auth/logout').set(CSRF);
    expect(res.status).toBe(200);
    expect(getAuthCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});

describe('GET /api/auth/session', () => {
  it('returns the signed-in user', async () => {
    const { agent, user } = await loggedInAgent();
    const res = await agent.get('/api/auth/session');

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('answers guests and bad tokens with data: null instead of a 401', async () => {
    const guest = await request(app).get('/api/auth/session');
    const invalid = await request(app)
      .get('/api/auth/session')
      .set('Authorization', 'Bearer not-a-jwt');

    expect(guest.status).toBe(200);
    expect(guest.body).toEqual({ success: true, data: null });
    expect(invalid.status).toBe(200);
    expect(invalid.body.data).toBeNull();
  });

  it('returns null once the user has logged out', async () => {
    const { agent } = await loggedInAgent();
    await agent.post('/api/auth/logout').set(CSRF);

    const res = await agent.get('/api/auth/session');
    expect(res.body.data).toBeNull();
  });
});
