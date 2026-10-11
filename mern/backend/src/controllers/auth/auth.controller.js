import User from '../../models/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { endSession, startSession } from '../../utils/auth/authCookie.js';
import { createResetToken, hashResetToken } from '../../utils/auth/resetToken.js';
import { passwordResetEmail } from '../../utils/email/accountEmails.js';
import sendEmail from '../../utils/email/sendEmail.js';
import siteUrl from '../../utils/siteUrl.js';

const RESET_LINK_MS = 60 * 60 * 1000;
// A second request this soon after a link was sent doesn't send another
const RESEND_AFTER_MS = 2 * 60 * 1000;
const RESET_SENT_MESSAGE =
  'If an account exists for that email, we have sent a link to reset the password.';

// The token itself is only ever sent as an httpOnly cookie, never in the body
const sendAuthResponse = (res, statusCode, user) => {
  const expiresAt = startSession(res, user);
  res.status(statusCode).json({ success: true, data: user, session: { expiresAt } });
};

// req.body is already validated and normalized by validators/auth/auth.schema.js

// POST /api/auth/signup
export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.exists({ email });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });
  sendAuthResponse(res, 201, user);
};

// Same message for every failure so emails (and which accounts are admins) can't be probed
const findUserByCredentials = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return user;
};

// POST /api/auth/login
export const login = async (req, res) => {
  const user = await findUserByCredentials(req.body);
  sendAuthResponse(res, 200, user);
};

// POST /api/auth/admin/login
// Only admins get a session here, so the admin sign-in never logs a customer in
export const adminLogin = async (req, res) => {
  const user = await findUserByCredentials(req.body);
  if (user.role !== 'admin') throw new ApiError(401, 'Invalid email or password');
  sendAuthResponse(res, 200, user);
};

// POST /api/auth/logout
// Public on purpose, so an expired session can still clear its cookie
export const logout = async (req, res) => {
  endSession(res);
  res.json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me (protected)
export const getMe = async (req, res) => {
  res.json({ success: true, data: req.user, session: { expiresAt: req.auth.expiresAt } });
};

// GET /api/auth/session (open to guests)
// Lets the client ask "who is signed in?" on every page load: a guest gets
// data: null instead of a 401, which browsers would log as an error
export const getSession = async (req, res) => {
  res.json({ success: true, data: req.user ?? null });
};

// POST /api/auth/forgot-password  { email }
// Always the same answer, so the form can't be used to find out who has an account.
// Admin passwords are set in .env and restored on every restart, so admins get no link.
export const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+resetPasswordExpires');
  const linkAge = RESET_LINK_MS - ((user?.resetPasswordExpires?.getTime() ?? 0) - Date.now());

  if (user && user.role !== 'admin' && linkAge > RESEND_AFTER_MS) {
    const { token, hash } = createResetToken();
    await User.updateOne(
      { _id: user._id },
      { resetPasswordHash: hash, resetPasswordExpires: new Date(Date.now() + RESET_LINK_MS) }
    );
    await sendEmail(passwordResetEmail(user, `${siteUrl(req)}/reset-password?token=${token}`));
  }
  res.json({ success: true, message: RESET_SENT_MESSAGE });
};

// POST /api/auth/reset-password  { token, password }
// The link works once; the new password also signs out every other device
export const resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordHash: hashResetToken(req.body.token),
    resetPasswordExpires: { $gt: new Date() },
    role: { $ne: 'admin' },
  });
  if (!user) {
    throw new ApiError(400, 'This reset link is invalid or has expired. Please ask for a new one.');
  }

  user.password = req.body.password;
  user.resetPasswordHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Your password has been changed. You can now log in.' });
};
