import ApiError from './ApiError.js';
import { deleteImage, isImageStorageReady, uploadImage } from './imageStorage.js';

// For places that hold one photo (the home page hero, a category). Upload the
// new photo first, save it, and only then discard the old one, so a failed
// upload never leaves the place without a photo.
export const storeSingleImage = async (file, folder) => {
  if (!isImageStorageReady()) {
    throw new ApiError(
      503,
      'Photo uploads are not set up yet. Add the Cloudinary keys to backend/.env'
    );
  }
  if (!file) throw new ApiError(400, 'Choose an image');
  return uploadImage(file.buffer, folder);
};

// Best effort: a leftover file on Cloudinary must not fail the request
export const discardImage = async (image) => {
  if (image?.publicId) await deleteImage(image.publicId).catch(() => {});
};
