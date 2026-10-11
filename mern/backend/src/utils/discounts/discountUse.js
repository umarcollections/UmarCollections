import Discount from '../../models/discount.model.js';
import { roundMoney } from '../money.js';

// Checks a code against a subtotal. Resolves to { discount, amount } when it
// applies, or { error: { message, minSubtotal? } } when it doesn't.
export const findUsableDiscount = async (code, subtotal, now = new Date()) => {
  const discount = await Discount.findOne({ code: code.toUpperCase() });

  if (!discount || !discount.active) return { error: { message: 'This code is not valid' } };
  if (discount.expiresAt && discount.expiresAt <= now) {
    return { error: { message: 'This code has expired' } };
  }
  if (discount.usageLimit != null && discount.usedCount >= discount.usageLimit) {
    return { error: { message: 'This code has been fully used' } };
  }
  if (subtotal < discount.minSubtotal) {
    return {
      error: {
        message: `Spend ${discount.minSubtotal} or more to use this code`,
        minSubtotal: discount.minSubtotal,
      },
    };
  }

  const amount =
    discount.type === 'percentage'
      ? roundMoney((subtotal * discount.value) / 100)
      : Math.min(discount.value, subtotal);
  return { discount, amount };
};

// Takes one use of the code, only while it is still active and under its limit,
// so orders placed at the same moment can't go past the limit
export const claimDiscountUse = async (discountId) => {
  const result = await Discount.updateOne(
    {
      _id: discountId,
      active: true,
      $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    },
    { $inc: { usedCount: 1 } }
  );
  return result.modifiedCount === 1;
};

export const releaseDiscountUse = (code) =>
  Discount.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
