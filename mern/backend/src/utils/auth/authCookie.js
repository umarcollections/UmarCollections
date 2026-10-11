import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import generateToken from './generateToken.js';

// The JWT lives in an httpOnly cookie: the browser sends it automatically,
// but page JavaScript (and so any injected script) can never read it.
export const AUTH_COOKIE = 'access_token';

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: '/',
});

// Signs a token for the user, sets it as the auth cookie and returns
// when the session expires
export const startSession = (res, user) => {
  const token = generateToken(user);
  const expiresAt = new Date(jwt.decode(token).exp * 1000);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), expires: expiresAt });
  return expiresAt;
};

export const endSession = (res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
};
