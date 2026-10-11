import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import User from '../../models/user.model.js';
import { getToken } from './protect.js';

// For routes open to guests that do more for signed-in users (checkout links
// the order to the account). A missing or bad token just means "guest".
const optionalAuth = async (req, res, next) => {
  const token = getToken(req);
  if (!token) return next();

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    return next();
  }

  req.user = (await User.findById(decoded.id)) ?? undefined;
  next();
};

export default optionalAuth;
