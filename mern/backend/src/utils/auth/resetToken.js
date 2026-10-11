import crypto from 'node:crypto';

// Forgot-password links hold a random token; only its hash is stored, so a
// database leak doesn't hand out working reset links
export const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const createResetToken = () => {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, hash: hashResetToken(token) };
};
