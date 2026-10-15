import { z } from 'zod';
import { discountCodeField } from '../discounts/discount.schema.js';
import { objectIdField } from '../products/product.schema.js';

export const MAX_QUANTITY = 20;

const itemsField = z
  .array(
    z.object({
      productId: objectIdField,
      variantId: objectIdField,
      quantity: z
        .number({ error: 'Quantity must be a number' })
        .int('Quantity must be a whole number')
        .min(1, 'Quantity must be at least 1')
        .max(MAX_QUANTITY, `At most ${MAX_QUANTITY} of one item per order`),
    })
  )
  .min(1, 'Your cart is empty')
  .max(50, 'Too many different items in one order');

export const text = (label, min, max) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(min, min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const quoteSchema = z.object({
  items: itemsField,
  discountCode: discountCodeField.optional(),
});

// Shared with the address book (validators/account/account.schema.js), so a
// saved address always passes checkout
// Digits with optional +, spaces, dashes or brackets, e.g. +92 300 1234567
export const phoneField = z
  .string({ error: 'Phone number is required' })
  .trim()
  .regex(/^\+?[\d\s()-]{7,20}$/, 'Please provide a valid phone number');

export const addressFields = {
  address: text('Address', 5, 300),
  city: text('City', 2, 80),
  postalCode: z.string().trim().max(20, 'Postal code is too long').default(''),
};

export const createOrderSchema = z.object({
  items: itemsField,
  discountCode: discountCodeField.optional(),
  customer: z.object({
    name: text('Name', 1, 80),
    email: z
      .string({ error: 'Email is required' })
      .trim()
      .toLowerCase()
      .pipe(z.email('Please provide a valid email')),
    phone: phoneField,
  }),
  shippingAddress: z.object(addressFields),
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters').default(''),
  // Signed-in customers can keep this address in their account
  saveAddress: z.boolean().default(false),
});

export const submitPaymentSchema = z.object({
  reference: text('Transaction reference', 3, 100),
});
