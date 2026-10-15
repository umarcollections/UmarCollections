import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import env from '../../src/config/env.js';
import verifyGoogleToken from '../../src/utils/auth/verifyGoogleToken.js';

const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const makeKey = (kid) => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  return {
    kid,
    privateKey,
    jwk: { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' },
  };
};
const google = makeKey('google-1');
const impostor = makeKey('google-1');
const rotated = makeKey('google-2');

const sign = (key, claims = {}, options = {}) =>
  jwt.sign(
    {
      sub: '1234567890',
      email: 'ayesha@gmail.com',
      email_verified: true,
      name: 'Ayesha Khan',
      ...claims,
    },
    key.privateKey,
    {
      algorithm: 'RS256',
      keyid: key.kid,
      audience: CLIENT_ID,
      issuer: 'https://accounts.google.com',
      expiresIn: '1h',
      ...options,
    }
  );

// Google's key endpoint, answering with the given keys and no caching
const serveKeys = (...sets) => {
  const fetchMock = vi.fn();
  sets.forEach((keys) =>
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'cache-control': 'public, max-age=0' }),
      json: async () => ({ keys: keys.map((k) => k.jwk) }),
    })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const savedGoogle = env.google;
beforeEach(() => {
  env.google = { clientId: CLIENT_ID };
});
afterEach(() => {
  env.google = savedGoogle;
  vi.unstubAllGlobals();
});

describe('verifyGoogleToken', () => {
  it('accepts a token Google signed for this store', async () => {
    serveKeys([google]);
    const claims = await verifyGoogleToken(sign(google));
    expect(claims).toMatchObject({ sub: '1234567890', email: 'ayesha@gmail.com' });
  });

  it.each([
    ['meant for another app', () => sign(google, {}, { audience: 'other-app' })],
    ['from another issuer', () => sign(google, {}, { issuer: 'https://evil.example' })],
    ['expired', () => sign(google, {}, { expiresIn: -10 })],
    ['signed by someone else with the same key id', () => sign(impostor)],
    ['not a token at all', () => 'not-a-token'],
  ])('refuses a token %s', async (_, token) => {
    serveKeys([google], [google]);
    await expect(verifyGoogleToken(token())).rejects.toMatchObject({ statusCode: 400 });
  });

  it('fetches the keys again when Google has rotated them', async () => {
    const fetchMock = serveKeys([google], [google, rotated]);
    const claims = await verifyGoogleToken(sign(rotated));
    expect(claims.sub).toBe('1234567890');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('answers 503 when Google cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(verifyGoogleToken(sign(google))).rejects.toMatchObject({ statusCode: 503 });
  });
});
