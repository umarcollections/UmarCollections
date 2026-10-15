import { Router } from 'express';
import {
  signup,
  login,
  adminLogin,
  logout,
  getMe,
  getSession,
  forgotPassword,
  resetPassword,
  googleLogin,
} from '../../controllers/auth/auth.controller.js';
import optionalAuth from '../../middleware/auth/optionalAuth.js';
import protect from '../../middleware/auth/protect.js';
import { authLimiter, passwordResetLimiter } from '../../middleware/auth/rateLimit.js';
import validate from '../../middleware/validate.js';
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from '../../validators/auth/auth.schema.js';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/admin/login', authLimiter, validate(loginSchema), adminLogin);
router.post('/google', authLimiter, validate(googleLoginSchema), googleLogin);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/session', optionalAuth, getSession);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
