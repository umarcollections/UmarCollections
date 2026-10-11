import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';

if (env.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

// False until the CLOUDINARY_* keys are in .env
export const isImageStorageReady = () => env.cloudinary.enabled;

// Uploads an in-memory file (from multer) and resolves to { url, publicId }.
// Cloudinary rejects anything that is not a real image, whatever its mimetype.
export const uploadImage = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });

export const deleteImage = (publicId) => cloudinary.uploader.destroy(publicId);
