import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
export const ROLES = ['user', 'admin'];

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
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // Never returned by queries unless asked for with .select('+password')
      select: false,
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'Role must be one of: ' + ROLES.join(', ') },
      default: 'user',
    },
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
  // A changed password signs out every device logged in before the change
  if (!this.isNew) this.sessionVersion += 1;
});

// Logins made before this version existed carry none, and count as version 0
userSchema.methods.acceptsSession = function (decodedToken) {
  return (decodedToken.v ?? 0) === this.sessionVersion;
};

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
