import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../components/common/Pagination.jsx';
import ProductGrid from '../../components/products/ProductGrid.jsx';
import PageBanner from '../../components/store/PageBanner.jsx';
import useCategories from '../../hooks/categories/useCategories.js';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import useMediaQuery from '../../hooks/common/useMediaQuery.js';
import useStoreMotion from '../../hooks/common/useStoreMotion.js';
import useProducts from '../../hooks/products/useProducts.js';
import store from '../../lib/store.js';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
];

// Same titles as the server sends (backend/src/controllers/seo/page.controller.js)
const pageTitle = ({ q, category, page }) => {
  if (q) return `Search: ${q}`;
  const title = category
    ? `Buy ${category.name} Online in ${store.city}`
    : `Shop Online in ${store.city}: All Products`;
  return Number.isInteger(page) && page > 1 ? `${title}, page ${page}` : title;
};

// "a, b and c"
const listOf = (words) =>
  words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : (words[0] ?? '');

const chipClass = (active) =>
  `rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
    active
      ? 'bg-espresso-900 text-cream-50'
      : 'bg-cream-50/70 text-espresso-900 backdrop-blur hover:bg-cream-50'
  }`;

const ShopPage = () => {
  const pageRef = useRef(null);
  // Filters live in the URL so links and the back button keep them
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const { data: categories = [] } = useCategories();
  const { data, error, isPending, isFetching } = useProducts({ q, category, sort, page });

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key)
    );
    setSearchParams(next);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ q: event.currentTarget.elements.q.value.trim(), page: '' });
  };

  const currentCategory = categories.find((c) => c.slug === category);
  const heading = currentCategory?.name ?? 'All products';
  const products = data?.data ?? [];
  const intro =
    currentCategory?.description ||
    (!category &&
      categories.length > 0 &&
      `Shop ${listOf(categories.map((c) => c.name.toLowerCase()))} from ${store.name}, delivered within ${store.city}.`);
  usePageTitle(pageTitle({ q, category: currentCategory, page }));
  // Phones and tablets get the search at the top of the page, not below the banner
  const searchOnTop = useMediaQuery('(max-width: 1023px)');

  const toolbar = (
    <div
      className={`flex flex-wrap items-center gap-4 ${searchOnTop ? 'mb-10' : 'border-b border-espresso-900/10 pb-8'}`}
    >
      <form onSubmit={handleSearch} role="search" className="relative min-w-[16rem] flex-1">
        <label htmlFor="shop-search" className="sr-only">
          Search products
        </label>
        <input
          id="shop-search"
          name="q"
          type="search"
          defaultValue={q}
          key={q}
          placeholder="Search products"
          className="w-full rounded-full border border-caramel-300 bg-cream-50 px-6 py-3.5 pr-28 text-sm text-espresso-900 outline-none transition placeholder:text-espresso-700/50 focus:border-caramel-500 focus:bg-white focus:ring-4 focus:ring-caramel-400/20"
        />
        <button
          type="submit"
          className="absolute inset-y-1.5 right-1.5 rounded-full bg-caramel-300 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso-900 transition hover:bg-caramel-400"
        >
          Search
        </button>
      </form>

      <label className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso-800">
        Sort
        <select
          value={sort}
          onChange={(event) =>
            updateParams({
              sort: event.target.value === 'newest' ? '' : event.target.value,
              page: '',
            })
          }
          // Phones and tablets get a compact pill so sorting doesn't outweigh the search
          className="min-w-52 rounded-full border border-caramel-300 bg-cream-50 px-5 py-3 text-sm normal-case tracking-normal text-espresso-900 outline-none transition focus:border-caramel-500 focus:bg-white focus:ring-4 focus:ring-caramel-400/20 max-lg:min-w-48 max-lg:px-4 max-lg:py-2 max-lg:font-medium max-lg:[&::picker-icon]:text-[0.6rem]"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  // New results get their own entrance
  useStoreMotion(pageRef, [heading, products.map((p) => p._id).join()]);

  return (
    <div ref={pageRef}>
      {/* Keyed so a new heading is rendered fresh instead of edited after it was split into words */}
      <PageBanner
        key={heading}
        eyebrow={data ? `${data.pagination.total} pieces` : 'Shop'}
        title={heading}
        text={intro}
        lead={searchOnTop && toolbar}
      >
        <div data-reveal className="mt-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateParams({ category: '', page: '' })}
            className={chipClass(!category)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => updateParams({ category: c.slug, page: '' })}
              className={chipClass(c.slug === category)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </PageBanner>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        {!searchOnTop && toolbar}

        <div
          className={`transition-opacity ${searchOnTop ? '' : 'mt-12'} ${isFetching && !isPending ? 'opacity-60' : ''}`}
        >
          {isPending && <p className="text-sm text-espresso-700">Loading products…</p>}
          {error && !data && <p className="text-sm text-red-700">{error.message}</p>}

          {data && products.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-display text-3xl text-espresso-900">
                {q ? `Nothing matches "${q}"` : 'No products here yet'}
              </p>
              {(q || category) && (
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-espresso-900 underline underline-offset-8"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {products.length > 0 && <ProductGrid products={products} />}

          {data && (
            <Pagination
              {...data.pagination}
              onChange={(next) => {
                updateParams({ page: next > 1 ? String(next) : '' });
                window.scrollTo({ top: 0 });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
