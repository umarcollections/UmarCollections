import { z } from 'zod';

// Mirrors backend/src/validators/products/product.schema.js and the upload limits
export const PRODUCT_STATUSES = ['draft', 'active', 'archived'];
export const MAX_OPTIONS = 3;
export const MAX_VARIANTS = 100;
export const MAX_IMAGES = 10;
// 4 MB keeps each upload under the 4.5 MB request limit on Vercel
export const MAX_IMAGE_MB = 4;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Checked before uploading so the admin isn't left waiting on a file the API will refuse
export const imageFileProblem = (file) => {
  if (!IMAGE_TYPES.includes(file.type)) return 'Photos must be JPG, PNG or WebP';
  if (file.size > MAX_IMAGE_MB * 1024 * 1024)
    return `Each photo must be ${MAX_IMAGE_MB} MB or smaller`;
  return null;
};

const MAX_PRICE = 10_000_000;
const MAX_STOCK = 1_000_000;
const MONEY = /^\d+(\.\d{1,2})?$/;
const WHOLE = /^\d+$/;

// "S, M , L," -> ['S', 'M', 'L']
export const parseOptionValues = (text) =>
  text
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const hasDuplicates = (list) => new Set(list).size !== list.length;

// Price, stock and SKU are only checked on the variants the product will sell
const checkVariant = (variant, i, issue) => {
  const at = (field) => ['variants', i, field];

  if (!MONEY.test(variant.price)) issue(at('price'), 'Enter a price like 1200 or 49.99');
  else if (Number(variant.price) > MAX_PRICE) issue(at('price'), 'Price is too high');

  if (variant.compareAtPrice) {
    if (!MONEY.test(variant.compareAtPrice)) {
      issue(at('compareAtPrice'), 'Enter a price like 1200 or 49.99');
    } else if (
      MONEY.test(variant.price) &&
      Number(variant.compareAtPrice) <= Number(variant.price)
    ) {
      issue(at('compareAtPrice'), 'Must be higher than the price');
    }
  }

  if (!WHOLE.test(variant.stock)) issue(at('stock'), 'Enter a whole number, 0 or more');
  else if (Number(variant.stock) > MAX_STOCK) issue(at('stock'), 'Stock is too high');
};

export const productFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Title must be at least 2 characters')
      .max(120, 'Title must be at most 120 characters'),
    description: z.string().trim().max(5000, 'Description must be at most 5000 characters'),
    category: z.string(),
    status: z.enum(PRODUCT_STATUSES),
    options: z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .min(1, 'Option name is required')
            .max(30, 'Option name is too long'),
          values: z.string(),
        })
      )
      .max(MAX_OPTIONS),
    variants: z.array(
      z.object({
        _id: z.string().optional(),
        baseStock: z.number().optional(),
        optionValues: z.array(z.string()),
        enabled: z.boolean(),
        sku: z.string().trim().max(60, 'SKU must be at most 60 characters'),
        price: z.string().trim(),
        compareAtPrice: z.string().trim(),
        stock: z.string().trim(),
      })
    ),
  })
  .superRefine(({ options, variants }, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: 'custom', path, message });

    options.forEach((option, i) => {
      const values = parseOptionValues(option.values);
      if (!values.length) issue(['options', i, 'values'], 'Add at least one value');
      else if (hasDuplicates(values))
        issue(['options', i, 'values'], 'Each value must be different');
      else if (values.length > 50) issue(['options', i, 'values'], 'At most 50 values');
      else if (values.some((value) => value.length > 40)) {
        issue(['options', i, 'values'], 'Each value must be at most 40 characters');
      }
    });

    const names = options.map((option) => option.name.trim().toLowerCase());
    names.forEach((name, i) => {
      if (name && names.indexOf(name) !== i) {
        issue(['options', i, 'name'], 'Option names must be different');
      }
    });

    const selling = variants
      .map((variant, i) => ({ variant, i }))
      .filter(({ variant }) => variant.enabled);
    if (!selling.length) return issue(['variants'], 'Select at least one variant to sell');
    if (selling.length > MAX_VARIANTS) {
      return issue(['variants'], `A product can have at most ${MAX_VARIANTS} variants`);
    }

    selling.forEach(({ variant, i }) => checkVariant(variant, i, issue));

    const skus = selling.map(({ variant }) => variant.sku.trim());
    selling.forEach(({ i }, n) => {
      if (skus[n] && skus.indexOf(skus[n]) !== n) {
        issue(['variants', i, 'sku'], 'Another variant has this SKU');
      }
    });
  });
