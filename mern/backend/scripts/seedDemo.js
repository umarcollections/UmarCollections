// Fills the store with demo categories and products so the storefront can be
// seen before real stock is added. Only what this script creates is touched:
//   npm run seed:demo               add (or refresh) the demo catalogue
//   npm run seed:demo -- --remove   delete it again
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import Category from '../src/models/category.model.js';
import Product from '../src/models/product.model.js';
import Settings from '../src/models/settings.model.js';
import { DEMO_CATEGORIES, DEMO_HERO_IMAGE, DEMO_PRODUCTS } from './demoData.js';

const removing = process.argv.includes('--remove');

const removeDemo = async () => {
  const products = await Product.deleteMany({ slug: { $in: DEMO_PRODUCTS.map((p) => p.slug) } });
  const categories = await Category.deleteMany({
    slug: { $in: DEMO_CATEGORIES.map((c) => c.slug) },
    // Keeps a category the admin has since filled with real products
    _id: { $nin: await Product.distinct('category') },
  });
  await Settings.updateOne({ 'heroImage.publicId': DEMO_HERO_IMAGE.publicId }, { heroImage: null });
  return { products: products.deletedCount, categories: categories.deletedCount };
};

const addDemo = async () => {
  const categoryIds = {};
  for (const { slug, name, description } of DEMO_CATEGORIES) {
    const category = await Category.findOneAndUpdate(
      { slug },
      {
        name,
        description,
        image: { url: `/demo/category-${slug}.svg`, publicId: `demo/category-${slug}` },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    categoryIds[slug] = category._id;
  }

  // create() rather than insertMany so the price range is worked out on save
  for (const { category, ...product } of DEMO_PRODUCTS) {
    await Product.create({ ...product, category: categoryIds[category] });
  }

  // Only fills an empty hero, never replaces a photo the admin uploaded
  await Settings.updateOne(
    { heroImage: null },
    { heroImage: DEMO_HERO_IMAGE },
    { upsert: !(await Settings.exists({})) }
  );
};

await mongoose.connect(env.mongoUri);

const removed = await removeDemo();
if (removing) {
  console.log(
    `Removed ${removed.products} demo products and ${removed.categories} demo categories`
  );
} else {
  await addDemo();
  console.log(
    `Added ${DEMO_PRODUCTS.length} demo products in ${DEMO_CATEGORIES.length} categories. ` +
      'Remove them with: npm run seed:demo -- --remove'
  );
}

await mongoose.disconnect();
