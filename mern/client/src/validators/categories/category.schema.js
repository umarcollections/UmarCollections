import { z } from 'zod';

// Mirrors backend/src/validators/categories/category.schema.js
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name must be at most 60 characters'),
  description: z.string().trim().max(500, 'Description must be at most 500 characters'),
});
