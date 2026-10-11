import mongoose from 'mongoose';

// awaiting_payment -> payment_submitted -> confirmed -> shipped -> delivered.
// A rejected payment goes back to awaiting_payment so the customer can try again;
// cancelled (by the admin or when the payment window runs out) releases the stock.
export const ORDER_STATUSES = [
  'awaiting_payment',
  'payment_submitted',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

// Everything is copied at the time of the order, so later edits to the
// product or the bank details never change what the customer agreed to
const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    variantLabel: { type: String, default: '' },
    sku: String,
    image: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, required: true, unique: true },
    // Hash of the secret in the customer's order link; the link itself is never stored
    accessKeyHash: { type: String, required: true, select: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    shippingAddress: {
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      postalCode: { type: String, trim: true, default: '' },
    },
    notes: { type: String, trim: true, default: '' },
    items: { type: [itemSchema], required: true },
    subtotal: { type: Number, required: true },
    // total = subtotal - discount.amount + shippingFee
    discount: { type: { _id: false, code: String, amount: Number }, default: null },
    shippingFee: { type: Number, required: true },
    total: { type: Number, required: true },
    bankAccounts: { type: Array, default: [] },
    status: { type: String, enum: ORDER_STATUSES, default: 'awaiting_payment' },
    paymentDueAt: { type: Date, required: true },
    payment: {
      reference: String,
      screenshot: { url: String, publicId: String },
      submittedAt: Date,
      confirmedAt: Date,
      // Set when the admin rejects a payment, shown to the customer
      rejectionNote: String,
    },
    shipment: {
      courier: String,
      trackingNumber: String,
      shippedAt: Date,
    },
    history: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (doc, ret) => {
        delete ret.accessKeyHash;
        return ret;
      },
    },
  }
);

orderSchema.index({ status: 1, paymentDueAt: 1 });
orderSchema.index({ 'customer.email': 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
