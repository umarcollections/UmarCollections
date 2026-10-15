import { Router } from 'express';
import {
  addAddress,
  changePassword,
  deleteAddress,
  makeDefaultAddress,
  updateAddress,
  updateProfile,
} from '../../controllers/account/account.controller.js';
import protect from '../../middleware/auth/protect.js';
import { authLimiter } from '../../middleware/auth/rateLimit.js';
import validate from '../../middleware/validate.js';
import {
  addressSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../../validators/account/account.schema.js';

// The signed-in customer's own profile, password and address book
const router = Router();

router.use(protect);

router.patch('/profile', validate(updateProfileSchema), updateProfile);
// Limited like login, since it checks a password
router.post('/password', authLimiter, validate(changePasswordSchema), changePassword);

router.post('/addresses', validate(addressSchema), addAddress);
router.route('/addresses/:id').put(validate(addressSchema), updateAddress).delete(deleteAddress);
router.post('/addresses/:id/default', makeDefaultAddress);

export default router;
