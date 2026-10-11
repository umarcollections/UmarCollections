import { z } from 'zod';

// Mirrors backend/src/validators/discounts/discount.schema.js
const CODE = /^[A-Z0-9_-]{3,30}$/;
const AMOUNT = /^\d+(\.\d{1,2})?$/;

const codeField = z
  .string()
  .trim()
  .toUpperCase()
  .regex(CODE, 'Codes are 3 to 30 letters, numbers, dashes or underscores');

export const applyDiscountSchema = z.object({ code: codeField });

// Admin form: numbers stay text while typing and are converted when saving
export const discountFormSchema = z
  .object({
    code: codeField,
    type: z.enum(['percentage', 'fixed']),
    value: z.string().trim().regex(AMOUNT, 'Enter a number like 10 or 500'),
    minSubtotal: z
      .string()
      .trim()
      .refine((value) => value === '' || AMOUNT.test(value), 'Enter an amount, or leave it empty'),
    expiresOn: z.string(),
    usageLimit: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || (/^\d+$/.test(value) && Number(value) >= 1),
        'Enter a whole number, or leave it empty'
      ),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!AMOUNT.test(data.value)) return;
    const value = Number(data.value);
    if (value <= 0) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Value must be more than 0' });
    }
    if (data.type === 'percentage' && value > 100) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'A percentage can be at most 100' });
    }
  });
