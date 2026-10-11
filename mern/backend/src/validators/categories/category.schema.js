import { z } from 'zod';

const nameField = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name is required')
  .max(60, 'Name must be at most 60 characters');

const descriptionField = z.string().trim().max(500, 'Description must be at most 500 characters');

export const createCategorySchema = z.object({
  name: nameField,
  description: descriptionField.default(''),
});

export const updateCategorySchema = z
  .object({
    name: nameField.optional(),
    description: descriptionField.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Send at least one of: name, description',
  });
