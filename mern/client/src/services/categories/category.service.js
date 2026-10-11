import { imageForm, request } from '../api.js';

// Each resolves to { data: category } except the list ({ data: [category] }) and delete
export const getCategoriesRequest = () => request('/categories');

export const createCategoryRequest = (payload) =>
  request('/admin/categories', { method: 'POST', body: payload });

export const updateCategoryRequest = (id, payload) =>
  request(`/admin/categories/${id}`, { method: 'PUT', body: payload });

export const deleteCategoryRequest = (id) =>
  request(`/admin/categories/${id}`, { method: 'DELETE' });

export const uploadCategoryImageRequest = (id, file) =>
  request(`/admin/categories/${id}/image`, { method: 'POST', body: imageForm(file) });

export const removeCategoryImageRequest = (id) =>
  request(`/admin/categories/${id}/image`, { method: 'DELETE' });
