import { z } from 'zod';
import { DISCOUNT_TYPES } from '../../models/discount.model.js';

// Letters, digits, dashes and underscores; stored in capitals
export const discountCodeField = z
  .string({ error: 'Discount code is required' })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,30}$/, 'Codes are 3 to 30 letters, numbers, dashes or underscores');

const amount = (label) =>
  z
    .number({ error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(10_000_000, `${label} is too high`);

const fields = {
  code: discountCodeField,
  type: z.enum(DISCOUNT_TYPES, { error: 'Type must be percentage or fixed' }),
  value: amount('Value'),
  minSubtotal: amount('Minimum subtotal').default(0),
  expiresAt: z.iso.datetime({ error: 'Expiry must be a date' }).nullable().default(null),
  usageLimit: z
    .number({ error: 'Usage limit must be a number' })
    .int('Usage limit must be a whole number')
    .min(1, 'Usage limit must be at least 1')
    .nullable()
    .default(null),
  active: z.boolean().default(true),
};

// A percentage must be 1 to 100, and any discount must take something off
const checkValue = (data, ctx) => {
  if (data.value === undefined) return;
  if (data.value <= 0) {
    ctx.addIssue({ code: 'custom', path: ['value'], message: 'Value must be more than 0' });
  }
  if (data.type === 'percentage' && data.value > 100) {
    ctx.addIssue({ code: 'custom', path: ['value'], message: 'A percentage can be at most 100' });
  }
};

// Create and update both send the whole form, so type and value are always checked together
export const discountSchema = z.object(fields).superRefine(checkValue);
