import { request } from '../api.js';

// The signed-in customer's own details. Each resolves to { data: user }.
export const updateProfileRequest = (profile) =>
  request('/account/profile', { method: 'PATCH', body: profile });

export const changePasswordRequest = (passwords) =>
  request('/account/password', { method: 'POST', body: passwords });

export const addAddressRequest = (address) =>
  request('/account/addresses', { method: 'POST', body: address });

export const updateAddressRequest = (id, address) =>
  request(`/account/addresses/${id}`, { method: 'PUT', body: address });

export const deleteAddressRequest = (id) =>
  request(`/account/addresses/${id}`, { method: 'DELETE' });

export const setDefaultAddressRequest = (id) =>
  request(`/account/addresses/${id}/default`, { method: 'POST' });
