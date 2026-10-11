import { Router } from 'express';
import {
  removeHeroImage,
  setHeroImage,
  updateSettings,
} from '../../controllers/settings/settings.controller.js';
import protect from '../../middleware/auth/protect.js';
import authorize from '../../middleware/auth/authorize.js';
import uploadImages from '../../middleware/upload.js';
import validate from '../../middleware/validate.js';
import { updateSettingsSchema } from '../../validators/settings/settings.schema.js';

const router = Router();

router.use(protect, authorize('admin'));

router.put('/', validate(updateSettingsSchema), updateSettings);
router
  .route('/hero-image')
  .post(uploadImages.single('image'), setHeroImage)
  .delete(removeHeroImage);

export default router;
