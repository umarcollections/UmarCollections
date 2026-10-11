import { Router } from 'express';
import {
  addImages,
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  removeImage,
  updateProduct,
} from '../../controllers/products/adminProduct.controller.js';
import protect from '../../middleware/auth/protect.js';
import authorize from '../../middleware/auth/authorize.js';
import validate from '../../middleware/validate.js';
import uploadImages from '../../middleware/upload.js';
import { MAX_IMAGES } from '../../models/product.model.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../../validators/products/product.schema.js';

const router = Router();

router.use(protect, authorize('admin'));

router.route('/').get(getProducts).post(validate(createProductSchema), createProduct);
router
  .route('/:id')
  .get(getProduct)
  .put(validate(updateProductSchema), updateProduct)
  .delete(deleteProduct);
router.post('/:id/images', uploadImages.array('images', MAX_IMAGES), addImages);
router.delete('/:id/images/:imageId', removeImage);

export default router;
