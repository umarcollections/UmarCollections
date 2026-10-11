import { Router } from 'express';
import {
  applyOrderAction,
  getOrder,
  getOrders,
} from '../../controllers/orders/adminOrder.controller.js';
import protect from '../../middleware/auth/protect.js';
import authorize from '../../middleware/auth/authorize.js';
import validate from '../../middleware/validate.js';
import { orderActionSchema } from '../../validators/orders/adminOrder.schema.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/:id/actions', validate(orderActionSchema), applyOrderAction);

export default router;
