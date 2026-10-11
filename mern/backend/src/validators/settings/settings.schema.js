import { z } from 'zod';

const text = (label, max) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const amount = (label) =>
  z
    .number({ error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(1_000_000, `${label} is too high`);

const optionalText = (label, max) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`).default('');

export const updateSettingsSchema = z.object({
  bankAccounts: z
    .array(
      z.object({
        bankName: text('Bank name', 60),
        accountTitle: text('Account title', 80),
        accountNumber: text('Account number', 40),
        iban: z.string().trim().max(40, 'IBAN must be at most 40 characters').default(''),
      })
    )
    .max(5, 'Add at most 5 bank accounts'),
  shippingFee: amount('Shipping fee'),
  freeShippingThreshold: amount('Free shipping threshold').nullable(),
  paymentWindowHours: z
    .number({ error: 'Payment window must be a number' })
    .int('Payment window must be whole hours')
    .min(1, 'Payment window must be at least 1 hour')
    .max(168, 'Payment window can be at most 168 hours (7 days)'),
  heroHeading: optionalText('Hero heading', 80),
  heroText: optionalText('Hero text', 200),
  announcement: optionalText('Announcement', 120),
});
