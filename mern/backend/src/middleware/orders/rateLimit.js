import rateLimit from 'express-rate-limit';
import env from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';

// Every order holds stock until it is paid or expires, so one visitor placing
// dozens of orders could empty the shop. 10 per hour per IP is plenty for real buyers.
export const orderLimiter = rateLimit({
  skip: () => env.isTest,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many orders from this connection, please try again later'));
  },
});
