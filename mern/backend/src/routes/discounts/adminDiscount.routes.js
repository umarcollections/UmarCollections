import { Router } from 'express';
import {
  createDiscount,
  deleteDiscount,
  getDiscounts,
  updateDiscount,
} from '../../controllers/discounts/adminDiscount.controller.js';
import protect from '../../middleware/auth/protect.js';
import authorize from '../../middleware/auth/authorize.js';
import validate from '../../middleware/validate.js';
import { discountSchema } from '../../validators/discounts/discount.schema.js';

const router = Router();

router.use(protect, authorize('admin'));

router.route('/').get(getDiscounts).post(validate(discountSchema), createDiscount);
router.route('/:id').put(validate(discountSchema), updateDiscount).delete(deleteDiscount);

export default router;
