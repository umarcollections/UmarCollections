import User, { MAX_ADDRESSES } from '../../models/user.model.js';

const sameAddress = (a, b) =>
  [a.address, a.city].join('|').toLowerCase().replace(/\s+/g, ' ') ===
  [b.address, b.city].join('|').toLowerCase().replace(/\s+/g, ' ');

// Keeps the address from an order in the customer's address book (asked for
// with the "save this address" box at checkout). An address already saved, or a
// full address book, is left alone; the first one saved becomes the default.
// Also fills in the profile phone if the customer hadn't given one.
const saveCheckoutAddress = async (userId, { customer, shippingAddress }) => {
  const user = await User.findById(userId);
  if (!user) return;

  if (!user.phone) user.phone = customer.phone;
  const known = user.addresses.some((saved) => sameAddress(saved, shippingAddress));
  if (!known && user.addresses.length < MAX_ADDRESSES) {
    user.addresses.push({ name: customer.name, phone: customer.phone, ...shippingAddress });
    if (user.addresses.length === 1) user.setDefaultAddress(user.addresses[0]._id);
  }
  await user.save();
};

export default saveCheckoutAddress;
