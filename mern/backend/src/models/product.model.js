import mongoose from 'mongoose';

export const PRODUCT_STATUSES = ['draft', 'active', 'archived'];
export const MAX_OPTIONS = 3;
export const MAX_IMAGES = 10;

// Stored to the cent so totals never pick up floating point noise
const money = {
  type: Number,
  min: [0, 'Price cannot be negative'],
  set: (value) => (value == null ? value : Math.round(value * 100) / 100),
};

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: { type: String, trim: true, default: '' },
});

// e.g. { name: 'Size', values: ['S', 'M', 'L'] }
const optionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    values: [{ type: String, trim: true }],
  },
  { _id: false }
);

// One buyable combination. optionValues follows the order of product.options,
// e.g. ['M', 'Black'] for options Size and Colour. Its _id is what carts and
// orders point at, so it is kept when a product is edited.
const variantSchema = new mongoose.Schema({
  optionValues: [{ type: String, trim: true }],
  sku: { type: String, trim: true },
  price: { ...money, required: [true, 'Price is required'] },
  compareAtPrice: money,
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    validate: { validator: Number.isInteger, message: 'Stock must be a whole number' },
  },
});

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    // Set once from the title, so product links never break
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    status: {
      type: String,
      enum: { values: PRODUCT_STATUSES, message: 'Status must be one of: draft, active, archived' },
      default: 'draft',
    },
    images: { type: [imageSchema], default: [] },
    options: { type: [optionSchema], default: [] },
    variants: {
      type: [variantSchema],
      validate: { validator: (v) => v.length > 0, message: 'A product needs at least one variant' },
    },
    // Copied from the variants on save so the catalogue can sort and filter by price
    priceMin: Number,
    priceMax: Number,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false, id: false },
  }
);

productSchema.index({ status: 1, category: 1, createdAt: -1 });

productSchema.virtual('inStock').get(function () {
  return this.variants.some((variant) => variant.stock > 0);
});

productSchema.pre('save', function () {
  const prices = this.variants.map((variant) => variant.price);
  this.priceMin = Math.min(...prices);
  this.priceMax = Math.max(...prices);
});

const Product = mongoose.model('Product', productSchema);

export default Product;
