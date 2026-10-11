import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
// 4 MB keeps each upload under the 4.5 MB request limit on Vercel
export const MAX_IMAGE_MB = 4;

// Keeps files in memory just long enough to stream them to Cloudinary:
//   router.post('/:id/images', uploadImages.array('images', 10), addImages);
const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, 'Images must be JPG, PNG or WebP'));
  },
});

export default uploadImages;
