import store from './store.js';

const formats = new Map();

// Whole amounts drop the decimals (Rs 1,200); others keep two (Rs 49.50)
const formatterFor = (digits) => {
  if (!formats.has(digits)) {
    formats.set(
      digits,
      new Intl.NumberFormat(store.locale, {
        style: 'currency',
        currency: store.currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    );
  }
  return formats.get(digits);
};

export const formatPrice = (value) => formatterFor(Number.isInteger(value) ? 0 : 2).format(value);

export const formatPriceRange = (min, max) =>
  min === max ? formatPrice(min) : `${formatPrice(min)} to ${formatPrice(max)}`;

export const formatDateTime = (value) =>
  new Intl.DateTimeFormat(store.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
