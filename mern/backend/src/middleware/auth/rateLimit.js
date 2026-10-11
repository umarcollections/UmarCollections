import rateLimit from 'express-rate-limit';
import env from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';

// Slows down password guessing on login/signup: 10 attempts per
// 15 minutes per IP. Successful logins don't count against the limit.
export const authLimiter = rateLimit({
  skip: () => env.isTest,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const minutes = Math.ceil(options.windowMs / 60000);
    next(new ApiError(429, `Too many attempts, please try again in ${minutes} minutes`));
  },
});

// Forgot-password requests always answer "sent", so every request counts here:
// 5 per 15 minutes per IP, which stops the form being used to flood an inbox
export const passwordResetLimiter = rateLimit({
  skip: () => env.isTest,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const minutes = Math.ceil(options.windowMs / 60000);
    next(new ApiError(429, `Too many requests, please try again in ${minutes} minutes`));
  },
});
