import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  quoteCart,
  submitPayment,
} from '../../controllers/orders/order.controller.js';
import optionalAuth from '../../middleware/auth/optionalAuth.js';
import protect from '../../middleware/auth/protect.js';
import { orderLimiter } from '../../middleware/orders/rateLimit.js';
import uploadImages from '../../middleware/upload.js';
import validate from '../../middleware/validate.js';
import {
  createOrderSchema,
  quoteSchema,
  submitPaymentSchema,
} from '../../validators/orders/order.schema.js';

const router = Router();

router.post('/quote', validate(quoteSchema), quoteCart);
router.post('/', orderLimiter, optionalAuth, validate(createOrderSchema), createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/:orderNumber', optionalAuth, getOrder);
// multer runs first so the reference field is parsed before validation
router.post(
  '/:orderNumber/payment',
  optionalAuth,
  uploadImages.single('screenshot'),
  validate(submitPaymentSchema),
  submitPayment
);

export default router;
