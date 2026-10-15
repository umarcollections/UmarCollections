import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import ApiError from '../ApiError.js';

// Google's public signing keys. They rotate, so they are cached for as long as
// Google says and fetched again when a token names a key we don't have.
const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const FAILED = 'Google sign-in failed, please try again';

let cache = { keys: [], expiresAt: 0 };

const googleKeys = async ({ refresh = false } = {}) => {
  if (!refresh && Date.now() < cache.expiresAt) return cache.keys;
  const res = await fetch(CERTS_URL, { signal: AbortSignal.timeout(5000) }).catch(() => null);
  if (!res?.ok)
    throw new ApiError(503, 'Google sign-in is unavailable right now, please try again');
  const { keys } = await res.json();
  const maxAge = Number(res.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 3600);
  cache = { keys, expiresAt: Date.now() + maxAge * 1000 };
  return keys;
};

// Checks the ID token Google gave the browser: signed by Google, meant for this
// store's client ID, from Google's issuer and not expired. Resolves to its
// claims ({ sub, email, email_verified, name, ... }). Failures are a 400, not a
// 401, so the client doesn't treat them as an expired session.
const verifyGoogleToken = async (credential) => {
  const kid = jwt.decode(credential, { complete: true })?.header?.kid;
  if (!kid) throw new ApiError(400, FAILED);

  let jwk = (await googleKeys()).find((key) => key.kid === kid);
  if (!jwk) jwk = (await googleKeys({ refresh: true })).find((key) => key.kid === kid);
  if (!jwk) throw new ApiError(400, FAILED);

  try {
    return jwt.verify(credential, crypto.createPublicKey({ key: jwk, format: 'jwk' }), {
      algorithms: ['RS256'],
      audience: env.google.clientId,
      issuer: ISSUERS,
    });
  } catch {
    throw new ApiError(400, FAILED);
  }
};

export default verifyGoogleToken;
