import Discount from '../../models/discount.model.js';
import ApiError from '../../utils/ApiError.js';

// All routes here are admin only (see routes/discounts/adminDiscount.routes.js)

const assertCodeFree = async (code, excludeId) => {
  if (await Discount.exists({ code, _id: { $ne: excludeId } })) {
    throw new ApiError(409, `The code ${code} already exists`);
  }
};

// GET /api/admin/discounts
export const getDiscounts = async (req, res) => {
  const discounts = await Discount.find().sort({ createdAt: -1 });
  res.json({ success: true, data: discounts });
};

// POST /api/admin/discounts
export const createDiscount = async (req, res) => {
  await assertCodeFree(req.body.code);
  const discount = await Discount.create(req.body);
  res.status(201).json({ success: true, data: discount });
};

// PUT /api/admin/discounts/:id
// usedCount is never set here: it only moves when orders are placed or cancelled
export const updateDiscount = async (req, res) => {
  await assertCodeFree(req.body.code, req.params.id);
  const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!discount) throw new ApiError(404, 'Discount not found');
  res.json({ success: true, data: discount });
};

// DELETE /api/admin/discounts/:id
// Orders keep their own copy of the code and amount, so deleting is safe
export const deleteDiscount = async (req, res) => {
  const discount = await Discount.findByIdAndDelete(req.params.id);
  if (!discount) throw new ApiError(404, 'Discount not found');
  res.json({ success: true, message: 'Discount deleted' });
};
