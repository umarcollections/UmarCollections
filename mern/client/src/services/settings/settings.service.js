import { imageForm, request } from '../api.js';

// All resolve to { data: { bankAccounts, shippingFee, freeShippingThreshold,
// paymentWindowHours, heroHeading, heroText, heroImage, announcement,
// checkoutOpen, uploadsEnabled } }
export const getSettingsRequest = () => request('/settings');

export const updateSettingsRequest = (payload) =>
  request('/admin/settings', { method: 'PUT', body: payload });

export const uploadHeroImageRequest = (file) =>
  request('/admin/settings/hero-image', { method: 'POST', body: imageForm(file) });

export const removeHeroImageRequest = () =>
  request('/admin/settings/hero-image', { method: 'DELETE' });
