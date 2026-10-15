import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
export const ROLES = ['user', 'admin'];
export const MAX_ADDRESSES = 5;

// A saved delivery address. One of them is the default, which fills checkout.
const addressSchema = new mongoose.Schema({
  // e.g. Home or Office
  label: { type: String, trim: true, default: '' },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  postalCode: { type: String, trim: true, default: '' },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      // Accounts made with "Continue with Google" start without one
      required: [
        function () {
          return !this.googleId;
        },
        'Password is required',
      ],
      minlength: [6, 'Password must be at least 6 characters'],
      // Never returned by queries unless asked for with .select('+password')
      select: false,
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'Role must be one of: ' + ROLES.join(', ') },
      default: 'user',
    },
    // Google's id for the person, set by "Continue with Google"
    googleId: { type: String, unique: true, sparse: true },
    // False for Google-only accounts until they set a password (forgot password)
    hasPassword: { type: Boolean, default: true },
    phone: { type: String, trim: true, default: '' },
    addresses: { type: [addressSchema], default: [] },
    // Stamped into every login; raised when the password changes, which signs
    // out every login made before (see middleware/auth/protect.js)
    sessionVersion: { type: Number, default: 0 },
    // Forgot-password link: only its hash is stored, like the order links
    resetPasswordHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        // The client only needs to know whether Google is connected
        ret.googleConnected = Boolean(ret.googleId);
        delete ret.googleId;
        delete ret.resetPasswordHash;
        delete ret.resetPasswordExpires;
        delete ret.sessionVersion;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash the password whenever it is set or changed
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  this.hasPassword = true;
  // A changed password signs out every device logged in before the change
  if (!this.isNew) this.sessionVersion += 1;
});

// Makes the address with this id the default and every other one not
userSchema.methods.setDefaultAddress = function (addressId) {
  this.addresses.forEach((address) => {
    address.isDefault = address._id.equals(addressId);
  });
};

// Logins made before this version existed carry none, and count as version 0
userSchema.methods.acceptsSession = function (decodedToken) {
  return (decodedToken.v ?? 0) === this.sessionVersion;
};

// Google-only accounts have no password, so nothing matches
userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
