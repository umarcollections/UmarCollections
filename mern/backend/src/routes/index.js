import { Router } from 'express';
import userRoutes from './users/user.routes.js';
import authRoutes from './auth/auth.routes.js';
import accountRoutes from './account/account.routes.js';
import categoryRoutes from './categories/category.routes.js';
import adminCategoryRoutes from './categories/adminCategory.routes.js';
import productRoutes from './products/product.routes.js';
import adminProductRoutes from './products/adminProduct.routes.js';
import orderRoutes from './orders/order.routes.js';
import adminOrderRoutes from './orders/adminOrder.routes.js';
import adminCustomerRoutes from './customers/adminCustomer.routes.js';
import adminDiscountRoutes from './discounts/adminDiscount.routes.js';
import settingsRoutes from './settings/settings.routes.js';
import adminSettingsRoutes from './settings/adminSettings.routes.js';

const router = Router();

// Register each resource here
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/account', accountRoutes);

// Storefront (public) and store management (admin only)
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/settings', settingsRoutes);
router.use('/admin/categories', adminCategoryRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/customers', adminCustomerRoutes);
router.use('/admin/discounts', adminDiscountRoutes);
router.use('/admin/settings', adminSettingsRoutes);

export default router;
