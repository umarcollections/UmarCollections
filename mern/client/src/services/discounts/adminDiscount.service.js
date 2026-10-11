import { request } from '../api.js';

// Resolves to { data: [discount] }
export const getDiscountsRequest = () => request('/admin/discounts');

// Both resolve to { data: discount }
export const createDiscountRequest = (payload) =>
  request('/admin/discounts', { method: 'POST', body: payload });

export const updateDiscountRequest = (id, payload) =>
  request(`/admin/discounts/${id}`, { method: 'PUT', body: payload });

export const deleteDiscountRequest = (id) =>
  request(`/admin/discounts/${id}`, { method: 'DELETE' });
