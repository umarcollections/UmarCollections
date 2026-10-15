import { z } from 'zod';
import { nameField, passwordField } from '../auth/auth.schema.js';
import { addressFields, phoneField, text } from '../orders/order.schema.js';

export const updateProfileSchema = z.object({
  name: nameField,
  // Optional on the profile; checkout asks for it anyway
  phone: z.union([z.literal(''), phoneField]).default(''),
});

export const addressSchema = z.object({
  label: z.string().trim().max(30, 'Label must be at most 30 characters').default(''),
  name: text('Name', 1, 80),
  phone: phoneField,
  ...addressFields,
  isDefault: z.boolean().default(false),
});

// currentPassword is empty when a Google-only account sets its first password
export const changePasswordSchema = z.object({
  currentPassword: z.string().max(200).default(''),
  newPassword: passwordField,
});
