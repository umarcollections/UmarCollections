import { z } from 'zod';

// Mirrors backend/src/validators/orders/adminOrder.schema.js
const optionalText = (label, max) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`);

export const rejectPaymentSchema = z.object({
  note: z
    .string()
    .trim()
    .min(3, 'Tell the customer why the payment was rejected')
    .max(300, 'Reason must be at most 300 characters'),
});

export const shipOrderSchema = z.object({
  courier: optionalText('Courier', 60),
  trackingNumber: optionalText('Tracking number', 80),
});

export const cancelOrderSchema = z.object({
  note: optionalText('Reason', 300),
});
