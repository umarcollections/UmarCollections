import mongoose from 'mongoose';

export const DISCOUNT_TYPES = ['percentage', 'fixed'];

const discountSchema = new mongoose.Schema(
  {
    // Stored in capitals so "summer10" and "SUMMER10" are the same code
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: DISCOUNT_TYPES, required: true },
    // A percentage (1 to 100) or an amount off, depending on type
    value: { type: Number, required: true, min: 0 },
    minSubtotal: { type: Number, min: 0, default: 0 },
    expiresAt: { type: Date, default: null },
    // null means unlimited
    usageLimit: { type: Number, min: 1, default: null },
    // Orders currently using the code; cancelled orders give their use back
    usedCount: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

const Discount = mongoose.model('Discount', discountSchema);

export default Discount;
