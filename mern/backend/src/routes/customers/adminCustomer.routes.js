import { Router } from 'express';
import { getCustomer, getCustomers } from '../../controllers/customers/adminCustomer.controller.js';
import protect from '../../middleware/auth/protect.js';
import authorize from '../../middleware/auth/authorize.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/', getCustomers);
router.get('/:email', getCustomer);

export default router;
