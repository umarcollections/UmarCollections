import { z } from 'zod';

// Mirrors backend/src/validators/settings/settings.schema.js. Amounts stay
// text while typing and are converted when saving.
const AMOUNT = /^\d+(\.\d{1,2})?$/;
const MAX_AMOUNT = 1_000_000;

const text = (label, max) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const isAmount = (value) => AMOUNT.test(value) && Number(value) <= MAX_AMOUNT;

export const settingsFormSchema = z.object({
  bankAccounts: z
    .array(
      z.object({
        bankName: text('Bank name', 60),
        accountTitle: text('Account title', 80),
        accountNumber: text('Account number', 40),
        iban: z.string().trim().max(40, 'IBAN must be at most 40 characters'),
      })
    )
    .max(5, 'Add at most 5 bank accounts'),
  shippingFee: z.string().trim().refine(isAmount, 'Enter an amount like 250, or 0 for free'),
  freeShippingThreshold: z
    .string()
    .trim()
    .refine((value) => value === '' || isAmount(value), 'Enter an amount, or leave it empty'),
  paymentWindowHours: z
    .string()
    .trim()
    .refine(
      (value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 168,
      'Enter whole hours from 1 to 168'
    ),
  heroHeading: z.string().trim().max(80, 'Heading must be at most 80 characters'),
  heroText: z.string().trim().max(200, 'Text must be at most 200 characters'),
  announcement: z.string().trim().max(120, 'Announcement must be at most 120 characters'),
});
