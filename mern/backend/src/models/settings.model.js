import mongoose from 'mongoose';

// Store-wide settings: a single document, edited from /admin/settings
const bankAccountSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true, trim: true },
    accountTitle: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    iban: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    // Shown at checkout and copied onto each order; checkout is closed while empty
    bankAccounts: { type: [bankAccountSchema], default: [] },
    shippingFee: { type: Number, min: 0, default: 0 },
    // Orders at or above this subtotal ship free; null turns it off
    freeShippingThreshold: { type: Number, min: 0, default: null },
    // Unpaid orders are cancelled and their stock released after this long
    paymentWindowHours: { type: Number, min: 1, default: 48 },
    // Home page. Empty text falls back to the storefront's default wording.
    heroHeading: { type: String, trim: true, default: '' },
    heroText: { type: String, trim: true, default: '' },
    heroImage: { type: { _id: false, url: String, publicId: String }, default: null },
    // Bar above the header; when empty the storefront shows the free delivery amount, if any
    announcement: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

const Settings = mongoose.model('Settings', settingsSchema);

// The saved settings, or the defaults before the admin has saved any
export const getSettings = async () => (await Settings.findOne()) ?? new Settings();

export default Settings;
