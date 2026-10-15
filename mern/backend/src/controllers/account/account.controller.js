import User, { MAX_ADDRESSES } from '../../models/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { startSession } from '../../utils/auth/authCookie.js';

// The signed-in customer's own details and address book. All routes need a
// login (see routes/account/account.routes.js) and answer with the updated user,
// so the client can show the change without asking again.

const findAddress = (user, id) => {
  const address = user.addresses.id(id);
  if (!address) throw new ApiError(404, 'Address not found');
  return address;
};

// PATCH /api/account/profile  { name, phone }
export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.name = req.body.name;
  user.phone = req.body.phone;
  await user.save();
  res.json({ success: true, data: user });
};

// POST /api/account/password  { currentPassword, newPassword }
// Changes the password, or sets the first one for a Google-only account.
// Signs out every other device; this one gets a fresh login so it stays signed in.
// A wrong current password is a 400, not a 401, so the client doesn't treat it
// as an expired session and log the customer out.
export const changePassword = async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  // The admin password comes from .env and is restored on every restart
  if (user.role === 'admin') {
    throw new ApiError(400, 'The admin password is set in the server settings (ADMIN_PASSWORD)');
  }
  // An account made with Google has no password yet; it sets its first one
  // without a current password, since Google has just confirmed who it is
  if (user.password && !(await user.comparePassword(req.body.currentPassword))) {
    throw new ApiError(400, 'Your current password is not right');
  }

  user.password = req.body.newPassword;
  await user.save();
  const expiresAt = startSession(res, user);
  res.json({ success: true, data: user, session: { expiresAt } });
};

// POST /api/account/addresses  { label, name, phone, address, city, postalCode, isDefault }
// The first address saved becomes the default
export const addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= MAX_ADDRESSES) {
    throw new ApiError(400, `You can save up to ${MAX_ADDRESSES} addresses. Delete one first.`);
  }

  const { isDefault, ...details } = req.body;
  user.addresses.push(details);
  const added = user.addresses.at(-1);
  if (isDefault || user.addresses.length === 1) user.setDefaultAddress(added._id);
  await user.save();
  res.status(201).json({ success: true, data: user });
};

// PUT /api/account/addresses/:id
export const updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = findAddress(user, req.params.id);
  const { isDefault, ...details } = req.body;

  address.set(details);
  if (isDefault) user.setDefaultAddress(address._id);
  await user.save();
  res.json({ success: true, data: user });
};

// POST /api/account/addresses/:id/default
export const makeDefaultAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.setDefaultAddress(findAddress(user, req.params.id)._id);
  await user.save();
  res.json({ success: true, data: user });
};

// DELETE /api/account/addresses/:id
// If the default goes, the next address takes its place
export const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = findAddress(user, req.params.id);
  const wasDefault = address.isDefault;

  address.deleteOne();
  if (wasDefault && user.addresses.length) user.setDefaultAddress(user.addresses[0]._id);
  await user.save();
  res.json({ success: true, data: user });
};
