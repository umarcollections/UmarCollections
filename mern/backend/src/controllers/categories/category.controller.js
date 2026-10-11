import Category from '../../models/category.model.js';
import Product from '../../models/product.model.js';
import ApiError from '../../utils/ApiError.js';
import { escapeRegex } from '../../utils/query.js';
import { discardImage, storeSingleImage } from '../../utils/singleImage.js';
import { uniqueSlug } from '../../utils/slug.js';

// "Bags" and "bags" would look like the same category to shoppers
const assertNameFree = async (name, excludeId) => {
  const taken = await Category.exists({
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
    _id: { $ne: excludeId },
  });
  if (taken) throw new ApiError(409, `A category named "${name}" already exists`);
};

// GET /api/categories (public)
export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, data: categories });
};

// The routes below are admin only (see routes/categories/adminCategory.routes.js)

// POST /api/admin/categories
export const createCategory = async (req, res) => {
  await assertNameFree(req.body.name);
  const slug = await uniqueSlug(Category, req.body.name);
  const category = await Category.create({ ...req.body, slug });
  res.status(201).json({ success: true, data: category });
};

// PUT /api/admin/categories/:id
export const updateCategory = async (req, res) => {
  if (req.body.name) await assertNameFree(req.body.name, req.params.id);
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
};

// DELETE /api/admin/categories/:id
export const deleteCategory = async (req, res) => {
  if (await Product.exists({ category: req.params.id })) {
    throw new ApiError(409, 'Move or delete the products in this category first');
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  await discardImage(category.image);
  res.json({ success: true, message: 'Category deleted' });
};

// POST /api/admin/categories/:id/image (multipart, field "image")
export const setCategoryImage = async (req, res) => {
  if (!(await Category.exists({ _id: req.params.id }))) {
    throw new ApiError(404, 'Category not found');
  }
  const image = await storeSingleImage(req.file, 'categories');
  const before = await Category.findByIdAndUpdate(req.params.id, { image });
  await discardImage(before?.image);
  res.json({ success: true, data: await Category.findById(req.params.id) });
};

// DELETE /api/admin/categories/:id/image
export const removeCategoryImage = async (req, res) => {
  const before = await Category.findByIdAndUpdate(req.params.id, { image: null });
  if (!before) throw new ApiError(404, 'Category not found');
  await discardImage(before.image);
  res.json({ success: true, data: await Category.findById(req.params.id) });
};
