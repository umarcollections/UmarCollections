import crypto from 'node:crypto';

// Guests reach their order through a link holding a random key. Only its hash
// is stored, so a database leak doesn't hand out working order links.
const hashOrderKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

export const createOrderKey = () => {
  const key = crypto.randomBytes(24).toString('base64url');
  return { key, hash: hashOrderKey(key) };
};

export const orderKeyMatches = (key, hash) => {
  if (typeof key !== 'string' || !key) return false;
  const given = Buffer.from(hashOrderKey(key));
  const stored = Buffer.from(hash);
  return given.length === stored.length && crypto.timingSafeEqual(given, stored);
};
