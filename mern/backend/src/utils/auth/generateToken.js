import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

// Signs a JWT carrying the user's id and session version (raised when the
// password changes, so older logins stop working)
const generateToken = (user) =>
  jwt.sign({ id: user._id, v: user.sessionVersion ?? 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export default generateToken;
