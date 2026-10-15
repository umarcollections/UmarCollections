import { z } from 'zod';
import { signupSchema } from '../auth/auth.schema.js';
import { checkoutSchema } from '../orders/checkout.schema.js';

// Mirrors backend/src/validators/account/account.schema.js. Address fields
// reuse the checkout rules, so a saved address always passes checkout.

export const profileSchema = z.object({
  name: signupSchema.shape.name,
  // Optional here; checkout asks for it anyway
  phone: z.union([z.literal(''), checkoutSchema.shape.phone]),
});

export const addressSchema = z.object({
  label: z.string().trim().max(30, 'Label must be at most 30 characters'),
  name: checkoutSchema.shape.name,
  phone: checkoutSchema.shape.phone,
  address: checkoutSchema.shape.address,
  city: checkoutSchema.shape.city,
  postalCode: checkoutSchema.shape.postalCode,
  isDefault: z.boolean(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: signupSchema.shape.password,
    confirmPassword: z.string().min(1, 'Type the new password again'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "The passwords don't match",
    path: ['confirmPassword'],
  });

// A Google-only account sets its first password without a current one
export const setPasswordSchema = z
  .object({
    newPassword: signupSchema.shape.password,
    confirmPassword: z.string().min(1, 'Type the new password again'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "The passwords don't match",
    path: ['confirmPassword'],
  });
