import { useRef } from 'react';
import { Link } from 'react-router-dom';
import CollectionTile from '../../components/categories/CollectionTile.jsx';
import CategoryMarquee from '../../components/home/CategoryMarquee.jsx';
import ClosingBand from '../../components/home/ClosingBand.jsx';
import EditorialSplit from '../../components/home/EditorialSplit.jsx';
import HomeHero from '../../components/home/HomeHero.jsx';
import ProductGrid from '../../components/products/ProductGrid.jsx';
import SectionHeading from '../../components/store/SectionHeading.jsx';
import useCategories from '../../hooks/categories/useCategories.js';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import useStoreMotion from '../../hooks/common/useStoreMotion.js';
import useProducts from '../../hooks/products/useProducts.js';
import useSettings from '../../hooks/settings/useSettings.js';

// One request covers new arrivals and the sale row
const CATALOGUE = { sort: 'newest', limit: 48 };
const isOnSale = (product) => product.variants.some((v) => v.compareAtPrice > v.price);

const HomePage = () => {
  const page = useRef(null);
  const { data: settings } = useSettings();
  const { data: catalogue } = useProducts(CATALOGUE);
  const { data: categories = [] } = useCategories();
  usePageTitle();

  const products = catalogue?.data ?? [];
  const newArrivals = products.slice(0, 8);
  const onSale = products.filter(isOnSale).slice(0, 4);
  const [featured, ...otherCategories] = categories;

  // Re-run the scroll animations once products and categories are on the page
  useStoreMotion(page, [products.length, categories.length]);

  return (
    <div ref={page}>
      {settings ? (
        <HomeHero settings={settings} categories={categories} newest={products[0]} />
      ) : (
        <div className="-mt-16 min-h-[88vh] bg-glow lg:-mt-20" />
      )}

      {categories.length > 0 && <CategoryMarquee categories={categories} />}

      {featured && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8 lg:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Collections" title="Shop by collection" />
            <Link
              data-reveal
              to="/collections"
              className="inline-block py-2 text-xs font-semibold uppercase tracking-[0.22em] text-espresso-900 underline underline-offset-8 hover:text-tangerine-700"
            >
              All collections
            </Link>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
            <div className="lg:row-span-2">
              <CollectionTile category={featured} tall />
            </div>
            {otherCategories.slice(0, 4).map((category) => (
              <CollectionTile key={category._id} category={category} />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="bg-caramel-300/15 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Just in" title="New arrivals" />
              <Link
                data-reveal
                to="/shop"
                className="inline-block py-2 text-xs font-semibold uppercase tracking-[0.22em] text-espresso-900 underline underline-offset-8 hover:text-tangerine-700"
              >
                View all
              </Link>
            </div>
            <div className="mt-14">
              <ProductGrid products={newArrivals} />
            </div>
          </div>
        </section>
      )}

      <EditorialSplit />

      {onSale.length > 0 && (
        <section className="bg-glow py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <SectionHeading eyebrow="Reduced" title="On sale now" />
            <div className="mt-14">
              <ProductGrid products={onSale} />
            </div>
          </div>
        </section>
      )}

      {/* Rendered once the count is known, so its animated heading never changes text */}
      {catalogue && (
        <div className="pt-24">
          <ClosingBand total={catalogue.pagination.total} />
        </div>
      )}
    </div>
  );
};

export default HomePage;
