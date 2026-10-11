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
export const getProducts = async (req, res) => {
  const { q, category, sort, page, limit } = productListQuerySchema.parse(req.query);
  const filter = { status: 'active' };

  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
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
