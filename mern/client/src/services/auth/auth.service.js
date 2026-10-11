import { request } from '../api.js';

// The server sets/clears the httpOnly auth cookie. Each call resolves to
// { data: user, session: { expiresAt } } except logout.
// A 401 from these is an expected answer, not an expired session.
export const signupRequest = (payload) =>
  request('/auth/signup', { method: 'POST', body: payload, notifyUnauthorized: false });

export const loginRequest = (payload) =>
  request('/auth/login', { method: 'POST', body: payload, notifyUnauthorized: false });

// Only succeeds for admin accounts
export const adminLoginRequest = (payload) =>
  request('/auth/admin/login', { method: 'POST', body: payload, notifyUnauthorized: false });

export const logoutRequest = () =>
  request('/auth/logout', { method: 'POST', notifyUnauthorized: false });

// Resolves to { data: user } when signed in and { data: null } for a guest
export const getSessionRequest = () => request('/auth/session');
