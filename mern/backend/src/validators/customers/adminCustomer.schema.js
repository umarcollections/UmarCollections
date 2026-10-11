import { z } from 'zod';

// Query strings are never rejected: bad values fall back to the defaults
export const adminCustomerListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(''),
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(25),
});
