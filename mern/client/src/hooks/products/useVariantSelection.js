import { useState } from 'react';

const matches = (variant, selected) =>
  variant.optionValues.every((value, i) => value === selected[i]);

// Starts on the first variant in stock, so the page doesn't open on a sold-out size
const initialSelection = (variants) =>
  (variants.find((variant) => variant.stock > 0) ?? variants[0]).optionValues;

// Which option values the shopper has picked, and the variant they add up to
const useVariantSelection = (product) => {
  const { variants } = product;
  const [selected, setSelected] = useState(() => initialSelection(variants));
  const variant = variants.find((v) => matches(v, selected)) ?? null;

  const withValue = (index, value) => selected.map((v, i) => (i === index ? value : v));

  // 'available', 'soldout', or 'unavailable' when that combination isn't sold
  const valueState = (index, value) => {
    const found = variants.find((v) => matches(v, withValue(index, value)));
    if (!found) return 'unavailable';
    return found.stock > 0 ? 'available' : 'soldout';
  };

  // If the exact combination isn't sold, jump to the closest one that is
  const choose = (index, value) => {
    const next = withValue(index, value);
    if (variants.some((v) => matches(v, next))) return setSelected(next);

    const candidates = variants.filter((v) => v.optionValues[index] === value);
    const best = candidates.find((v) => v.stock > 0) ?? candidates[0];
    if (best) setSelected(best.optionValues);
  };

  // Values listed on the product that no variant actually uses are left out
  const options = product.options.map((option, index) => ({
    name: option.name,
    values: option.values.filter((value) => variants.some((v) => v.optionValues[index] === value)),
  }));

  return { options, selected, variant, choose, valueState };
};

export default useVariantSelection;
