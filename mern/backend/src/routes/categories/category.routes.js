import { Router } from 'express';
import { getCategories } from '../../controllers/categories/category.controller.js';

const router = Router();

router.get('/', getCategories);

export default router;
