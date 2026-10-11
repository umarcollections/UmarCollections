import Product from '../../models/product.model.js';
import { getSettings } from '../../models/settings.model.js';
import { findUsableDiscount } from '../discounts/discountUse.js';
import { roundMoney } from '../money.js';

// The same variant added twice becomes one line
const mergeItems = (items) => {
  const lines = new Map();
  items.forEach((item) => {
    const key = `${item.productId}:${item.variantId}`;
    const existing = lines.get(key);
    lines.set(key, existing ? { ...existing, quantity: existing.quantity + item.quantity } : item);
  });
  return [...lines.values()];
};

const stockProblem = (stock, quantity) => {
  if (stock === 0) return 'Sold out';
  if (stock < quantity) return `Only ${stock} left`;
  return null;
};

// Prices a cart from the database, never from what the browser sent. Lines that
// can't be bought as they are carry a `problem` and are left out of the totals.
// A discount code that doesn't apply comes back as discountError, not a failure,
// so the cart can say why.
export const priceCart = async (items, discountCode) => {
  const merged = mergeItems(items);
  const [products, settings] = await Promise.all([
    Product.find({ _id: { $in: merged.map((item) => item.productId) }, status: 'active' }),
    getSettings(),
  ]);
  const byId = new Map(products.map((product) => [product.id, product]));

  const lines = merged.map(({ productId, variantId, quantity }) => {
    const product = byId.get(productId);
    const variant = product?.variants.id(variantId);
    if (!variant) return { productId, variantId, quantity, problem: 'No longer available' };

    return {
      productId,
      variantId,
      quantity,
      slug: product.slug,
      title: product.title,
      variantLabel: variant.optionValues.join(' / '),
      sku: variant.sku,
      image: product.images[0]?.url ?? null,
      price: variant.price,
      stock: variant.stock,
      lineTotal: roundMoney(variant.price * quantity),
      problem: stockProblem(variant.stock, quantity),
    };
  });

  const subtotal = roundMoney(
    lines.filter((line) => !line.problem).reduce((sum, line) => sum + line.lineTotal, 0)
  );

  const applied = discountCode ? await findUsableDiscount(discountCode, subtotal) : null;
  const discount = applied?.discount
    ? { code: applied.discount.code, amount: applied.amount }
    : null;
  const afterDiscount = roundMoney(subtotal - (discount?.amount ?? 0));

  // Free shipping is judged on what the customer actually pays for the goods
  const freeShipping =
    settings.freeShippingThreshold != null && afterDiscount >= settings.freeShippingThreshold;
  const shippingFee = subtotal === 0 || freeShipping ? 0 : settings.shippingFee;

  return {
    lines,
    subtotal,
    discount,
    discountError: applied?.error ?? null,
    shippingFee,
    total: roundMoney(afterDiscount + shippingFee),
    ready: lines.every((line) => !line.problem),
    settings,
    discountRecord: applied?.discount ?? null,
  };
};
