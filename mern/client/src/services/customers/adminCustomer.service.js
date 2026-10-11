import { request } from '../api.js';
import { toQueryString } from '../../lib/queryString.js';

// Resolves to { data: [customer], pagination }; a customer is
// { email, name, phone, city, orders, paid, lastOrderAt, firstOrderAt, registered }
export const getCustomersRequest = (params = {}) =>
  request(`/admin/customers${toQueryString(params)}`);

// Resolves to { data: { ...customer, orderList: [order] } }
export const getCustomerRequest = (email) =>
  request(`/admin/customers/${encodeURIComponent(email)}`);
