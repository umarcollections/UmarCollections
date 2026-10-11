import Category from '../../models/category.model.js';
import Product, { MAX_IMAGES } from '../../models/product.model.js';
import ApiError from '../../utils/ApiError.js';
import { deleteImage, isImageStorageReady, uploadImage } from '../../utils/imageStorage.js';
import { escapeRegex, paginate } from '../../utils/query.js';
import { uniqueSlug } from '../../utils/slug.js';
import { adminProductListQuerySchema } from '../../validators/products/product.schema.js';

// All routes here are admin only (see routes/products/adminProduct.routes.js)

const IMAGE_FOLDER = 'products';

const findProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

const assertCategoryExists = async (categoryId) => {
  if (categoryId && !(await Category.exists({ _id: categoryId }))) {
    throw new ApiError(400, 'Category not found');
  }
};

// Puts the existing images in the order sent, with the new alt text. The list
// must name every current image once; uploads and deletes have their own routes.
const reorderImages = (current, requested) => {
  const byId = new Map(current.map((image) => [image.id, image]));
  const sameSet =
    requested.length === current.length &&
    new Set(requested.map((image) => image._id)).size === current.length &&
    requested.every((image) => byId.has(image._id));
  if (!sameSet) throw new ApiError(400, 'Images must list every current image once');

  return requested.map(({ _id, alt }) => ({ ...byId.get(_id).toObject(), alt }));
};

// The edit form sends the stock it was showing as baseStock, and only the
// admin's change is applied. Orders placed while the form was open reserve
// stock too, and saving the form must not hand that stock out a second time.
const mergeStock = (incoming, current) =>
  incoming.map(({ baseStock, ...variant }) => {
    const existing = variant._id && current.id(variant._id);
    if (!existing || baseStock === undefined) return variant;
    return { ...variant, stock: Math.max(0, existing.stock + variant.stock - baseStock) };
  });

// Cleanup is best effort: a leftover file on Cloudinary must not fail the request
const deleteImages = (images) =>
  Promise.allSettled(images.map((image) => deleteImage(image.publicId)));

// GET /api/admin/products?q=&status=&page=&limit=
export const getProducts = async (req, res) => {
  const { q, status, page, limit } = adminProductListQuerySchema.parse(req.query);
  const filter = {};
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
  if (status) filter.status = status;

  const { items, pagination } = await paginate(Product, filter, {
    page,
    limit,
    sort: { updatedAt: -1, _id: 1 },
    populate: { path: 'category', select: 'name slug' },
  });
  res.json({ success: true, data: items, pagination });
};

// GET /api/admin/products/:id
export const getProduct = async (req, res) => {
  const product = await findProduct(req.params.id);
  res.json({ success: true, data: product });
};

// POST /api/admin/products
export const createProduct = async (req, res) => {
  await assertCategoryExists(req.body.category);
  const slug = await uniqueSlug(Product, req.body.title);
  const product = await Product.create({ ...req.body, slug });
  res.status(201).json({ success: true, data: product });
};

// PUT /api/admin/products/:id
// Uses save() rather than findByIdAndUpdate so the price range is recalculated
export const updateProduct = async (req, res) => {
  const product = await findProduct(req.params.id);
  const { images, ...changes } = req.body;

  await assertCategoryExists(changes.category);
  if (images) product.images = reorderImages(product.images, images);
  if (changes.variants) changes.variants = mergeStock(changes.variants, product.variants);

  product.set(changes);
  await product.save();
  res.json({ success: true, data: product });
};

// DELETE /api/admin/products/:id
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  await deleteImages(product.images);
  res.json({ success: true, message: 'Product deleted' });
};

// POST /api/admin/products/:id/images (multipart, field "images")
export const addImages = async (req, res) => {
  if (!isImageStorageReady()) {
    throw new ApiError(
      503,
      'Photo uploads are not set up yet. Add the Cloudinary keys to backend/.env'
    );
  }
  const product = await findProduct(req.params.id);
  const files = req.files ?? [];

  if (!files.length) throw new ApiError(400, 'Choose at least one image');
  if (product.images.length + files.length > MAX_IMAGES) {
    throw new ApiError(400, `A product can have at most ${MAX_IMAGES} images`);
  }

  const results = await Promise.allSettled(
    files.map((file) => uploadImage(file.buffer, IMAGE_FOLDER))
  );
  const uploaded = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  // All or nothing, so a half-finished upload never leaves stray files behind
  if (uploaded.length !== files.length) {
    await deleteImages(uploaded);
    throw new ApiError(502, 'Image upload failed, please try again');
  }

  product.images.push(...uploaded.map((image) => ({ ...image, alt: product.title })));
  await product.save();
  res.status(201).json({ success: true, data: product });
};

// DELETE /api/admin/products/:id/images/:imageId
export const removeImage = async (req, res) => {
  const product = await findProduct(req.params.id);
  const image = product.images.id(req.params.imageId);
  if (!image) throw new ApiError(404, 'Image not found');

  image.deleteOne();
  await product.save();
  await deleteImages([image]);
  res.json({ success: true, data: product });
};
