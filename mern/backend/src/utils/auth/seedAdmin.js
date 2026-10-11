import env from '../../config/env.js';
import User from '../../models/user.model.js';

// Keeps the store owner's account in line with ADMIN_EMAIL and ADMIN_PASSWORD,
// so changing the password in .env and restarting is all it takes
const seedAdmin = async () => {
  const { email, password } = env.admin;
  if (!email) return;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    await User.create({ name: 'Store Admin', email, password, role: 'admin' });
    console.log(`Admin account created for ${email}`);
    return;
  }

  const samePassword = await user.comparePassword(password);
  if (user.role === 'admin' && samePassword) return;

  user.role = 'admin';
  if (!samePassword) user.password = password;
  await user.save();
  console.log(`Admin account updated for ${email}`);
};

export default seedAdmin;
