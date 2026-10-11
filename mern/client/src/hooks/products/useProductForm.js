import { useCallback, useEffect, useRef } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseOptionValues, productFormSchema } from '../../validators/products/product.schema.js';

const comboKey = (optionValues) => optionValues.join('\u0000');

// Every combination of option values: [['S'], ['M']] x [['Black']] -> [['S', 'Black'], ['M', 'Black']].
// No options gives a single empty combination, the product's only variant.
const combinations = (valueLists) =>
  valueLists.reduce(
    (combos, values) => combos.flatMap((combo) => values.map((value) => [...combo, value])),
    [[]]
  );

const blankRow = (optionValues, overrides) => ({
  optionValues,
  enabled: true,
  sku: '',
  price: '',
  compareAtPrice: '',
  stock: '',
  ...overrides,
});

const toRow = (variant) => ({
  _id: variant._id,
  // Lets the server apply only the admin's change if orders took stock meanwhile
  baseStock: variant.stock,
  optionValues: variant.optionValues,
  enabled: true,
  sku: variant.sku ?? '',
  price: String(variant.price),
  compareAtPrice: variant.compareAtPrice == null ? '' : String(variant.compareAtPrice),
  stock: String(variant.stock),
});

// One row per combination; combinations the product doesn't sell start unticked
export const toFormValues = (product) => {
  if (!product) {
    return {
      title: '',
      description: '',
      category: '',
      status: 'draft',
      options: [],
      variants: [blankRow([])],
    };
  }

  const options = product.options.map((option) => ({
    name: option.name,
    values: option.values.join(', '),
  }));
  const existing = new Map(product.variants.map((v) => [comboKey(v.optionValues), toRow(v)]));
  const combos = combinations(product.options.map((option) => option.values));

  return {
    title: product.title,
    description: product.description,
    category: product.category ?? '',
    status: product.status,
    options,
    variants: combos.map(
      (combo) => existing.get(comboKey(combo)) ?? blankRow(combo, { enabled: false })
    ),
  };
};

// Form values -> request body for POST/PUT /api/admin/products
export const toPayload = (values) => ({
  title: values.title,
  description: values.description,
  category: values.category || null,
  status: values.status,
  options: values.options.map((option) => ({
    name: option.name,
    values: parseOptionValues(option.values),
  })),
  variants: values.variants
    .filter((variant) => variant.enabled)
    .map((variant) => ({
      ...(variant._id && { _id: variant._id, baseStock: variant.baseStock }),
      optionValues: variant.optionValues,
      sku: variant.sku || undefined,
      price: Number(variant.price),
      compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
      stock: Number(variant.stock),
    })),
});

// The product form, with the variant rows kept in step with the options:
// editing option values adds or removes rows, and a row that comes back
// (a value removed then typed again) gets its old price, stock and id back.
const useProductForm = (product) => {
  const form = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(product),
  });
  const { control, getValues, reset } = form;
  const optionFields = useFieldArray({ control, name: 'options' });
  const variantFields = useFieldArray({ control, name: 'variants' });
  const { replace } = variantFields;
  const rowCache = useRef(new Map());

  const options = useWatch({ control, name: 'options' });
  const valuesKey = JSON.stringify(options.map((option) => parseOptionValues(option.values)));

  useEffect(() => {
    const valueLists = JSON.parse(valuesKey);
    // An option without values yet would wipe every row, so wait for the admin to type some
    if (valueLists.some((values) => values.length === 0)) return;

    const current = getValues('variants');
    current.forEach((row) => rowCache.current.set(comboKey(row.optionValues), row));

    const combos = combinations(valueLists);
    if (
      combos.map(comboKey).join('|') === current.map((row) => comboKey(row.optionValues)).join('|')
    ) {
      return;
    }

    // New rows start at the price already entered, since sizes usually cost the same
    const price = current.find((row) => row.enabled)?.price ?? '';
    const next = combos.map(
      (combo) => rowCache.current.get(comboKey(combo)) ?? blankRow(combo, { price })
    );
    // With no options the single row is the product itself, so it is always sold
    replace(valueLists.length ? next : [{ ...next[0], enabled: true }]);
  }, [valuesKey, getValues, replace]);

  // After a save, start again from the server's copy so new variants get their ids
  const resetTo = useCallback(
    (saved) => {
      rowCache.current.clear();
      reset(toFormValues(saved));
    },
    [reset]
  );

  return { form, optionFields, variantFields, resetTo };
};

export default useProductForm;
