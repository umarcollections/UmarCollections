import { request } from '../api.js';
import { toQueryString } from '../../lib/queryString.js';

// Storefront calls: the API only ever returns active products here

// Resolves to { data: [product], pagination: { page, limit, total, pages } }
export const getProductsRequest = (params = {}) => request(`/products${toQueryString(params)}`);

// Resolves to { data: product }
export const getProductRequest = (slug) => request(`/products/${encodeURIComponent(slug)}`);
