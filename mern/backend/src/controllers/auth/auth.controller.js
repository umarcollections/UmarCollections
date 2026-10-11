import User from '../../models/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { endSession, startSession } from '../../utils/auth/authCookie.js';

// The token itself is only ever sent as an httpOnly cookie, never in the body
const sendAuthResponse = (res, statusCode, user) => {
  const expiresAt = startSession(res, user._id);
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
