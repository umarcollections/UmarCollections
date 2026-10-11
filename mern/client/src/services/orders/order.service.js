import { request } from '../api.js';

// items: [{ productId, variantId, quantity }]

// Resolves to { data: { lines, subtotal, discount, discountError, shippingFee, total,
// ready, checkoutOpen } }. An empty discountCode is left out.
export const quoteCartRequest = (items, discountCode) =>
  request('/orders/quote', {
    method: 'POST',
    body: { items, ...(discountCode && { discountCode }) },
  });

// Resolves to { data: { order, key } }; key belongs in the customer's order link
export const createOrderRequest = (payload) =>
  request('/orders', { method: 'POST', body: payload });

const orderPath = (orderNumber, key, action = '') =>
  `/orders/${encodeURIComponent(orderNumber)}${action}?key=${encodeURIComponent(key)}`;

// Orders placed while signed in; resolves to { data: [order] }
export const getMyOrdersRequest = () => request('/orders/mine');

// Resolves to { data: order }. Signed-in owners don't need the key.
export const getOrderRequest = (orderNumber, key) => request(orderPath(orderNumber, key));

// Resolves to { data: order }
export const submitPaymentRequest = (orderNumber, key, { reference, screenshot }) => {
  const form = new FormData();
  form.append('reference', reference);
  if (screenshot) form.append('screenshot', screenshot);
  return request(orderPath(orderNumber, key, '/payment'), { method: 'POST', body: form });
};
