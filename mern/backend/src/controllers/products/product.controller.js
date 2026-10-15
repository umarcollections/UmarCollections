import Category from '../../models/category.model.js';
import Product from '../../models/product.model.js';
import ApiError from '../../utils/ApiError.js';
import { escapeRegex, paginate } from '../../utils/query.js';
import { productListQuerySchema } from '../../validators/products/product.schema.js';

// Public storefront routes: only active products are ever visible here

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { priceMin: 1, _id: 1 },
  'price-desc': { priceMax: -1, _id: 1 },
};

// GET /api/products?q=&category=<slug>&sort=&page=&limit=
// q matches part of the product name or category name, ignoring case
export const getProducts = async (req, res) => {
  const { q, category, sort, page, limit } = productListQuerySchema.parse(req.query);
  const filter = { status: 'active' };

  // A search matches the product name or its category's name, so "bag" finds
  // everything in Bags, not only products with "bag" in their name
  if (q) {
    const pattern = { $regex: escapeRegex(q), $options: 'i' };
    const matchingCategories = await Category.find({ name: pattern }).distinct('_id');
    filter.$or = [{ title: pattern }, { category: { $in: matchingCategories } }];
  }
  if (category) {
    const found = await Category.findOne({ slug: category });
    // An unknown category shows no products rather than every product
    if (!found) {
      return res.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } });
    }
    filter.category = found._id;
  }

  const { items, pagination } = await paginate(Product, filter, {
    page,
    limit,
    sort: SORTS[sort],
    populate: { path: 'category', select: 'name slug' },
  });
  res.json({ success: true, data: items, pagination });
};

// GET /api/products/:slug
export const getProduct = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: 'active' }).populate(
    'category',
    'name slug'
  );
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
};
