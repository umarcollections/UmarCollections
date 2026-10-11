import { request } from '../api.js';
import { toQueryString } from '../../lib/queryString.js';

// Resolves to { data: [product], pagination: { page, limit, total, pages } }
export const getAdminProductsRequest = (params = {}) =>
  request(`/admin/products${toQueryString(params)}`);

// The rest resolve to { data: product }, except delete
export const getAdminProductRequest = (id) => request(`/admin/products/${id}`);

export const createProductRequest = (payload) =>
  request('/admin/products', { method: 'POST', body: payload });

export const updateProductRequest = (id, payload) =>
  request(`/admin/products/${id}`, { method: 'PUT', body: payload });

export const deleteProductRequest = (id) => request(`/admin/products/${id}`, { method: 'DELETE' });

export const uploadProductImagesRequest = (id, files) => {
  const form = new FormData();
  files.forEach((file) => form.append('images', file));
  return request(`/admin/products/${id}/images`, { method: 'POST', body: form });
};

export const removeProductImageRequest = (id, imageId) =>
  request(`/admin/products/${id}/images/${imageId}`, { method: 'DELETE' });
