import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  removeCategoryImage,
  setCategoryImage,
  updateCategory,
} from '../../controllers/categories/category.controller.js';
import protect from '../../middleware/auth/protect.js';
import authorize from '../../middleware/auth/authorize.js';
import uploadImages from '../../middleware/upload.js';
import validate from '../../middleware/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../../validators/categories/category.schema.js';

const router = Router();

router.use(protect, authorize('admin'));

router.post('/', validate(createCategorySchema), createCategory);
router.route('/:id').put(validate(updateCategorySchema), updateCategory).delete(deleteCategory);
router
  .route('/:id/image')
  .post(uploadImages.single('image'), setCategoryImage)
  .delete(removeCategoryImage);

export default router;
