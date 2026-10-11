import { nextSequence } from '../../models/counter.model.js';
import Order from '../../models/order.model.js';
import ApiError from '../ApiError.js';
import { claimDiscountUse, releaseDiscountUse } from '../discounts/discountUse.js';
import { createOrderKey } from './orderKey.js';
import { priceCart } from './pricing.js';
import { releaseStock, reserveStock } from './stock.js';

const HOUR_MS = 60 * 60 * 1000;

const describeLine = (line) =>
  line.title ? [line.title, line.variantLabel].filter(Boolean).join(', ') : 'An item in your cart';

// Prices the cart, reserves the stock and saves the order. Resolves to
// { order, key } where key goes in the customer's private order link.
const placeOrder = async ({ items, discountCode, customer, shippingAddress, notes, userId }) => {
  const { lines, subtotal, discount, discountError, discountRecord, shippingFee, total, settings } =
    await priceCart(items, discountCode);

  if (!settings.bankAccounts.length) {
    throw new ApiError(503, 'Checkout is not available yet. Please try again later.');
  }
  const problem = lines.find((line) => line.problem);
  if (problem) throw new ApiError(409, `${describeLine(problem)}: ${problem.problem}`);
  if (discountError) throw new ApiError(409, `Discount code: ${discountError.message}`);

  const orderItems = lines.map((line) => ({
    product: line.productId,
    variant: line.variantId,
    title: line.title,
    variantLabel: line.variantLabel,
    sku: line.sku,
    image: line.image,
    price: line.price,
    quantity: line.quantity,
  }));

  if (!(await reserveStock(orderItems))) {
    throw new ApiError(
      409,
      'Some items sold out while you were checking out. Please review your cart.'
    );
  }

  // The code may have hit its limit since it was checked a moment ago
  if (discountRecord && !(await claimDiscountUse(discountRecord._id))) {
    await releaseStock(orderItems);
    throw new ApiError(409, 'Discount code: This code has been fully used');
  }

  // Stock and the code's use are already taken, so give them back if the order can't be saved
  try {
    const { key, hash } = createOrderKey();
    const order = await Order.create({
      orderNumber: await nextSequence('order'),
      accessKeyHash: hash,
      user: userId ?? null,
      customer,
      shippingAddress,
      notes,
      items: orderItems,
      subtotal,
      discount,
      shippingFee,
      total,
      bankAccounts: settings.bankAccounts.map((account) => account.toObject()),
      paymentDueAt: new Date(Date.now() + settings.paymentWindowHours * HOUR_MS),
      history: [{ status: 'awaiting_payment' }],
    });
    return { order, key };
  } catch (error) {
    await releaseStock(orderItems);
    if (discount) await releaseDiscountUse(discount.code);
    throw error;
  }
};

export default placeOrder;
