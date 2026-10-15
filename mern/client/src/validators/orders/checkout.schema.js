import { z } from 'zod';
import { IMAGE_TYPES, MAX_IMAGE_MB } from '../products/product.schema.js';

// Mirrors backend/src/validators/orders/order.schema.js
export const MAX_QUANTITY = 20;

const text = (label, min, max) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const checkoutSchema = z.object({
  name: text('Name', 1, 80),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .pipe(z.email('Please provide a valid email')),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, 'Please provide a valid phone number, e.g. 0300 1234567'),
  address: text('Address', 5, 300),
  city: text('City', 2, 80),
  postalCode: z.string().trim().max(20, 'Postal code is too long'),
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters'),
});

// While photo uploads are off the screenshot field isn't on the page, and the
// reference alone is enough
export const paymentSchema = z.object({
  reference: text('Transaction reference', 3, 100),
});

// screenshot is the FileList from the file input
export const paymentWithScreenshotSchema = paymentSchema.extend({
  screenshot: z
    .custom()
    .refine((files) => files?.length > 0, {
      message: 'Attach a screenshot of your payment',
      abort: true,
    })
    .refine((files) => IMAGE_TYPES.includes(files[0].type), {
      message: 'Screenshot must be a JPG, PNG or WebP image',
    })
    .refine((files) => files[0].size <= MAX_IMAGE_MB * 1024 * 1024, {
      message: `Screenshot must be ${MAX_IMAGE_MB} MB or smaller`,
    }),
});

// The checkout form also carries the "save this address" box for signed-in customers
export const checkoutFormSchema = checkoutSchema.extend({ saveAddress: z.boolean() });
