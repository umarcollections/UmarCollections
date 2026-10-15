import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import SearchSuggestions from './SearchSuggestions.jsx';
import StoreIcon from './StoreIcon.jsx';
import useDebouncedValue from '../../hooks/common/useDebouncedValue.js';

// How long typing has to pause before the matches are fetched
const SEARCH_DELAY_MS = 250;

// Search bar that drops down under the header from its search icon, on any page.
// Matching products show under it as the visitor types; Enter opens them all
// on the shop page.
const StoreSearch = ({ onClose }) => {
  const root = useRef(null);
  const input = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [term, setTerm] = useState(searchParams.get('q') ?? '');
  const settledTerm = useDebouncedValue(term.trim(), SEARCH_DELAY_MS);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Opacity rather than autoAlpha: a hidden field would lose its focus
        gsap.from('[data-search-bar]', { y: -12, opacity: 0, duration: 0.35, ease: 'power3.out' });
        gsap.from('[data-search-backdrop]', { opacity: 0, duration: 0.3 });
      });
    },
    { scope: root }
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const q = term.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  return (
    <div ref={root}>
      {/* Tapping the page around the bar closes it */}
      <div
        data-search-backdrop
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 -z-10 bg-espresso-900/20"
      />
      <div
        data-search-bar
        id="store-search"
        className="absolute inset-x-0 top-full bg-cream-50/90 shadow-lg shadow-espresso-900/10 backdrop-blur-xl"
      >
        <form
          role="search"
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl px-4 py-3 sm:px-8 sm:py-4"
        >
          <label htmlFor="header-search" className="sr-only">
            Search products
          </label>
          <div className="relative">
            <StoreIcon
              name="search"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-espresso-700"
            />
            <input
              ref={input}
              id="header-search"
              name="q"
              type="search"
              enterKeyHint="search"
              autoFocus
              autoComplete="off"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-controls="search-suggestions"
              placeholder="Search products"
              className="w-full rounded-full border border-caramel-300 bg-white py-3 pl-12 pr-40 text-sm text-espresso-900 outline-none transition placeholder:text-espresso-700/50 focus:border-caramel-500 focus:ring-4 focus:ring-caramel-400/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {term && (
              <button
                type="button"
                onClick={() => {
                  setTerm('');
                  input.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-28 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-espresso-800 transition hover:bg-caramel-300/40"
              >
                <StoreIcon name="close" className="size-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute inset-y-1.5 right-1.5 rounded-full bg-espresso-900 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-50 transition hover:bg-espresso-800"
            >
              Search
            </button>
          </div>
          <SearchSuggestions term={settledTerm} />
        </form>
      </div>
    </div>
  );
};

export default StoreSearch;
