import { request } from '../api.js';
import { toQueryString } from '../../lib/queryString.js';

// Resolves to { data: [order], pagination: { page, limit, total, pages } }
export const getAdminOrdersRequest = (params = {}) =>
  request(`/admin/orders${toQueryString(params)}`);

// Both resolve to { data: order }
export const getAdminOrderRequest = (id) => request(`/admin/orders/${id}`);

// action: { action: 'confirm_payment' | 'reject_payment' | 'ship' | 'deliver' | 'cancel', ...details }
export const orderActionRequest = (id, action) =>
  request(`/admin/orders/${id}/actions`, { method: 'POST', body: action });
