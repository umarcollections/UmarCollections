import { useRef } from 'react';
import CollectionTile from '../../components/categories/CollectionTile.jsx';
import PageBanner from '../../components/store/PageBanner.jsx';
import useCategories from '../../hooks/categories/useCategories.js';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import useStoreMotion from '../../hooks/common/useStoreMotion.js';
import store from '../../lib/store.js';

const CollectionsPage = () => {
  const page = useRef(null);
  const { data: categories, error, isPending } = useCategories();
  usePageTitle('All Collections');
  useStoreMotion(page, [categories?.length]);

  return (
    <div ref={page}>
      <PageBanner
        eyebrow="Collections"
        title="Find what you came for"
        text={`Every collection at ${store.name}, with delivery within ${store.city}. Pick one to see its pieces, sizes and what is in stock.`}
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        {isPending && <p className="text-sm text-espresso-700">Loading collections…</p>}
        {error && <p className="text-sm text-red-700">{error.message}</p>}
        {categories?.length === 0 && (
          <p className="text-espresso-800">No collections yet. Check back soon.</p>
        )}
        {categories?.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, i) => (
              // Every other card sits a little lower, which staggers the grid on wide screens
              <li key={category._id} className={i % 3 === 1 ? 'lg:translate-y-16' : ''}>
                <CollectionTile category={category} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CollectionsPage;
