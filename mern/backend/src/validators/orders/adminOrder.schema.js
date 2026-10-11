import { z } from 'zod';
import { ORDER_STATUSES } from '../../models/order.model.js';

const optionalText = (label, max) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`).default('');

// One body per action the admin can take on an order
export const orderActionSchema = z.discriminatedUnion(
  'action',
  [
    z.object({ action: z.literal('confirm_payment') }),
    z.object({
      action: z.literal('reject_payment'),
      // Shown to the customer, so they know what to fix
      note: z
        .string({ error: 'Tell the customer why the payment was rejected' })
        .trim()
        .min(3, 'Tell the customer why the payment was rejected')
        .max(300, 'Reason must be at most 300 characters'),
    }),
    z.object({
      action: z.literal('ship'),
      courier: optionalText('Courier', 60),
      trackingNumber: optionalText('Tracking number', 80),
    }),
    z.object({ action: z.literal('deliver') }),
    z.object({ action: z.literal('cancel'), note: optionalText('Reason', 300) }),
  ],
  { error: 'Unknown order action' }
);

// Query strings are never rejected: bad values fall back to the defaults
export const adminOrderListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(''),
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(25),
});
