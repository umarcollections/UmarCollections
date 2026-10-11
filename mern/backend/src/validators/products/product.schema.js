import { z } from 'zod';
import { MAX_OPTIONS, PRODUCT_STATUSES } from '../../models/product.model.js';

export const objectIdField = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const priceField = z
  .number({ error: 'Price must be a number' })
  .min(0, 'Price cannot be negative')
  .max(10_000_000, 'Price is too high');

const titleField = z
  .string({ error: 'Title is required' })
  .trim()
  .min(2, 'Title must be at least 2 characters')
  .max(120, 'Title must be at most 120 characters');

const descriptionField = z.string().trim().max(5000, 'Description must be at most 5000 characters');

const optionSchema = z.object({
  name: z.string().trim().min(1, 'Option name is required').max(30, 'Option name is too long'),
  values: z
    .array(z.string().trim().min(1, 'Option values cannot be empty').max(40))
    .min(1, 'Each option needs at least one value')
    .max(50, 'An option can have at most 50 values'),
});

const variantSchema = z.object({
  // Sent back when editing so carts and orders keep pointing at the same variant
  _id: objectIdField.optional(),
  // The stock the edit form started from; see mergeStock in adminProduct.controller.js
  baseStock: z.number().int().min(0).optional(),
  optionValues: z.array(z.string().trim()).default([]),
  sku: z
    .string()
    .trim()
    .max(60, 'SKU must be at most 60 characters')
    .optional()
    .transform((sku) => sku || undefined),
  price: priceField,
  compareAtPrice: priceField.nullish(),
  stock: z
    .number({ error: 'Stock must be a number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(1_000_000, 'Stock is too high'),
});

const optionsField = z
  .array(optionSchema)
  .max(MAX_OPTIONS, `A product can have at most ${MAX_OPTIONS} options`);
const variantsField = z
  .array(variantSchema)
  .min(1, 'A product needs at least one variant')
  .max(100, 'A product can have at most 100 variants');

const hasDuplicates = (list) => new Set(list).size !== list.length;

// Rules that span options and variants together, so zod can't express them per field
const checkVariants = ({ options, variants }, ctx) => {
  const fail = (message) => ctx.addIssue({ code: 'custom', message });

  if (hasDuplicates(options.map((option) => option.name.toLowerCase()))) {
    fail('Option names must be different');
  }
  options.forEach((option) => {
    if (hasDuplicates(option.values)) fail(`${option.name} has the same value twice`);
  });
  if (options.length === 0 && variants.length > 1) {
    fail('A product without options has exactly one variant');
  }

  variants.forEach((variant) => {
    const label = variant.optionValues.join(' / ') || 'The variant';
    const matches =
      variant.optionValues.length === options.length &&
      variant.optionValues.every((value, i) => options[i].values.includes(value));

    if (!matches) fail(`${label} does not match the product options`);
    if (variant.compareAtPrice != null && variant.compareAtPrice <= variant.price) {
      fail(`${label}: compare-at price must be higher than the price`);
    }
  });

  if (
    options.length > 0 &&
    hasDuplicates(variants.map((variant) => variant.optionValues.join('\u0000')))
  ) {
    fail('Two variants have the same options');
  }
  if (hasDuplicates(variants.map((variant) => variant.sku).filter(Boolean))) {
    fail('Two variants have the same SKU');
  }
  if (hasDuplicates(variants.map((variant) => variant._id).filter(Boolean))) {
    fail('Two variants have the same id');
  }
};

export const createProductSchema = z
  .object({
    title: titleField,
    description: descriptionField.default(''),
    category: objectIdField.nullish(),
    status: z.enum(PRODUCT_STATUSES).default('draft'),
    options: optionsField.default([]),
    variants: variantsField,
  })
  .superRefine(checkVariants);

export const updateProductSchema = z
  .object({
    title: titleField.optional(),
    description: descriptionField.optional(),
    category: objectIdField.nullish(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    options: optionsField.optional(),
    variants: variantsField.optional(),
    // Reorders images (the first is the main photo) and edits their alt text
    images: z
      .array(z.object({ _id: objectIdField, alt: z.string().trim().max(150).default('') }))
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Send at least one field' })
  .refine((data) => (data.options === undefined) === (data.variants === undefined), {
    message: 'Send options and variants together',
  })
  .superRefine((data, ctx) => {
    if (data.options && data.variants) checkVariants(data, ctx);
  });

// Query strings are never rejected: bad values fall back to the defaults
const pageField = z.coerce.number().int().min(1).catch(1);
const limitField = z.coerce.number().int().min(1).max(48).catch(24);
const searchField = z.string().trim().max(100).catch('');

export const productListQuerySchema = z.object({
  q: searchField,
  category: z.string().trim().max(80).catch(''),
  sort: z.enum(['newest', 'price-asc', 'price-desc']).catch('newest'),
  page: pageField,
  limit: limitField,
});

export const adminProductListQuerySchema = z.object({
  q: searchField,
  status: z.enum(PRODUCT_STATUSES).optional().catch(undefined),
  page: pageField,
  limit: limitField,
});
