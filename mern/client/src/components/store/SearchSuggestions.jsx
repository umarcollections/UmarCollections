import { Link } from 'react-router-dom';
import { useProductSuggestions } from '../../hooks/products/useProducts.js';
import { formatPrice } from '../../lib/format.js';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The title with the typed letters picked out, e.g. "Wool <Sc>arf" for "sc"
const highlight = (title, term) =>
  title.split(new RegExp(`(${escapeRegex(term)})`, 'ig')).map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="bg-transparent font-semibold text-tangerine-700">
        {part}
      </mark>
    ) : (
      part
    )
  );

// Live matches under the header search, refreshed as the visitor types.
// term is the settled (debounced) search; the full results live on /shop?q=.
const SearchSuggestions = ({ term }) => {
  const { data, isPending, isFetching } = useProductSuggestions(term);
  if (!term) return null;

  const products = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const allResults = `/shop?q=${encodeURIComponent(term)}`;

  return (
    <div
      id="search-suggestions"
      className={`mt-3 overflow-hidden rounded-3xl border border-caramel-300/60 bg-cream-50 shadow-xl shadow-espresso-900/10 transition-opacity ${
        isFetching ? 'opacity-70' : ''
      }`}
    >
      {/* Screen readers hear how many matched, without moving focus off the field */}
      <p className="sr-only" aria-live="polite">
        {isPending ? '' : `${total} ${total === 1 ? 'product' : 'products'} found`}
      </p>

      {isPending && <p className="px-5 py-4 text-sm text-espresso-700">Searching…</p>}

      {!isPending && products.length === 0 && (
        <p className="px-5 py-4 text-sm text-espresso-800">
          Nothing matches &ldquo;{term}&rdquo;.{' '}
          <Link to="/shop" className="font-semibold underline underline-offset-4">
            Browse all products
          </Link>
        </p>
      )}

      {products.length > 0 && (
        <ul className="max-h-[60vh] divide-y divide-caramel-300/40 overflow-y-auto">
          {products.map((product) => (
            <li key={product._id}>
              <Link
                to={`/products/${product.slug}`}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-cream-200/60 focus-visible:bg-cream-200/60 focus-visible:outline-none"
              >
                <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                  {product.images[0] && (
                    <img src={product.images[0].url} alt="" className="size-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  {product.category?.name && (
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-caramel-700">
                      {highlight(product.category.name, term)}
                    </span>
                  )}
                  <span className="block truncate text-sm text-espresso-900">
                    {highlight(product.title, term)}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-espresso-900">
                  {product.priceMin !== product.priceMax && 'From '}
                  {formatPrice(product.priceMin)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > products.length && (
        <Link
          to={allResults}
          className="block border-t border-caramel-300/50 px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso-900 transition hover:bg-cream-200/60"
        >
          See all {total} results
        </Link>
      )}
    </div>
  );
};

export default SearchSuggestions;
