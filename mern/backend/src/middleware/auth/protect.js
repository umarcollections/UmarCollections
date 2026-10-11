import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import User from '../../models/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { AUTH_COOKIE } from '../../utils/auth/authCookie.js';

// Browsers send the JWT in the httpOnly auth cookie. Other clients
// (mobile apps, Postman, tests) can send "Authorization: Bearer <token>".
export const getToken = (req) => {
  const cookieToken = req.cookies?.[AUTH_COOKIE];
  if (cookieToken) return cookieToken;

  const [scheme, headerToken] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' ? headerToken : null;
};

// Requires a valid token and attaches the logged-in user to req.user and
// the session expiry to req.auth
const protect = async (req, res, next) => {
  const token = getToken(req);
  if (!token) throw new ApiError(401, 'Not authorized, please log in');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Session expired, please log in again'
        : 'Not authorized, invalid token';
    throw new ApiError(401, message);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists');

  req.user = user;
  req.auth = { expiresAt: new Date(decoded.exp * 1000) };
  next();
};

export default protect;
