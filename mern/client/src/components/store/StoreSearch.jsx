import { useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import StoreIcon from './StoreIcon.jsx';

// Search bar that drops down under the header from its search icon, on any page.
// The results are the shop page filtered by what was typed.
const StoreSearch = ({ onClose }) => {
  const root = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
    const q = event.currentTarget.elements.q.value.trim();
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
              id="header-search"
              name="q"
              type="search"
              enterKeyHint="search"
              autoFocus
              defaultValue={searchParams.get('q') ?? ''}
              placeholder="Search products"
              className="w-full rounded-full border border-caramel-300 bg-white py-3 pl-12 pr-28 text-sm text-espresso-900 outline-none transition placeholder:text-espresso-700/50 focus:border-caramel-500 focus:ring-4 focus:ring-caramel-400/20"
            />
            <button
              type="submit"
              className="absolute inset-y-1.5 right-1.5 rounded-full bg-espresso-900 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-50 transition hover:bg-espresso-800"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreSearch;
