import env from '../../config/env.js';
import Settings, { getSettings } from '../../models/settings.model.js';
import { isImageStorageReady } from '../../utils/imageStorage.js';
import { discardImage, storeSingleImage } from '../../utils/singleImage.js';

// Everything here is shown at checkout anyway, so one shape serves the
// storefront and the admin form
const toResponse = (settings) => ({
  bankAccounts: settings.bankAccounts,
  shippingFee: settings.shippingFee,
  freeShippingThreshold: settings.freeShippingThreshold,
  paymentWindowHours: settings.paymentWindowHours,
  heroHeading: settings.heroHeading,
  heroText: settings.heroText,
  heroImage: settings.heroImage?.url ? { url: settings.heroImage.url } : null,
  announcement: settings.announcement,
  checkoutOpen: settings.bankAccounts.length > 0,
  uploadsEnabled: isImageStorageReady(),
  // Shows "Continue with Google" when set; the ID is public by design
  googleClientId: env.google.clientId ?? null,
});

// GET /api/settings (public)
export const getStoreSettings = async (req, res) => {
  res.json({ success: true, data: toResponse(await getSettings()) });
};

// PUT /api/admin/settings (admin only)
export const updateSettings = async (req, res) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, {
    upsert: true,
    returnDocument: 'after',
    runValidators: true,
    setDefaultsOnInsert: true,
  });
  res.json({ success: true, data: toResponse(settings) });
};

// POST /api/admin/settings/hero-image (multipart, field "image")
export const setHeroImage = async (req, res) => {
  const image = await storeSingleImage(req.file, 'site');
  const before = await Settings.findOneAndUpdate(
    {},
    { heroImage: image },
    { upsert: true, returnDocument: 'before', setDefaultsOnInsert: true }
  );
  await discardImage(before?.heroImage);
  res.json({ success: true, data: toResponse(await getSettings()) });
};

// DELETE /api/admin/settings/hero-image
export const removeHeroImage = async (req, res) => {
  const before = await Settings.findOneAndUpdate(
    {},
    { heroImage: null },
    { returnDocument: 'before' }
  );
  await discardImage(before?.heroImage);
  res.json({ success: true, data: toResponse(await getSettings()) });
};
