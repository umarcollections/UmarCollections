import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import StoreIcon from './StoreIcon.jsx';
import StoreMenu from './StoreMenu.jsx';
import StoreSearch from './StoreSearch.jsx';
import useAuth from '../../hooks/auth/useAuth.js';
import useCart from '../../hooks/cart/useCart.js';
import useCategories from '../../hooks/categories/useCategories.js';
import Wordmark from './Wordmark.jsx';

const NAV_LINKS = [
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections' },
  { to: '/about', label: 'About' },
];

const navClass = ({ isActive }) =>
  `relative py-1 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-300 ${
    isActive
      ? 'text-espresso-900 after:scale-x-100'
      : 'text-espresso-800 after:scale-x-0 hover:text-espresso-900 hover:after:scale-x-100'
  }`;

const accountLink = (user) => {
  if (user?.role === 'admin') return { to: '/admin', label: 'Admin' };
  if (user) return { to: '/account', label: 'Your account' };
  return { to: '/login', label: 'Log in' };
};

// Transparent over the top of the page, frosted cream once the visitor scrolls
const StoreHeader = () => {
  const { user } = useAuth();
  const { count, openDrawer } = useCart();
  const seenCount = useRef(count);
  const { data: categories = [] } = useCategories();
  const [scrolled, setScrolled] = useState(false);
  const { key } = useLocation();
  // The open panel ('menu' or 'search') and the page it was opened on, so going
  // to another page (a link, a search, Back) closes it
  const [opened, setOpened] = useState(null);
  const panel = opened?.key === key ? opened.name : null;
  const menuOpen = panel === 'menu';
  const searchOpen = panel === 'search';
  const togglePanel = (name) => setOpened(panel === name ? null : { name, key });
  const closePanel = () => setOpened(null);
  const header = useRef(null);
  const account = accountLink(user);

  useGSAP(
    () => {
      // A position check rather than an on/off range, which switched off again at
      // the very bottom of the page
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => setScrolled(self.scroll() > 24),
      });
    },
    { scope: header }
  );

  // The bag's number pops when something is added or removed
  useGSAP(
    () => {
      if (seenCount.current === count) return;
      seenCount.current = count;
      // An empty cart shows no number, so there is nothing to pop
      if (count === 0) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-cart-count]',
          { scale: 1.6 },
          { scale: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.4)' }
        );
      });
    },
    { scope: header, dependencies: [count] }
  );

  // Escape closes the open panel; behind the full-screen menu the page doesn't scroll
  useEffect(() => {
    if (!panel) return;
    const onKey = (event) => event.key === 'Escape' && setOpened(null);
    if (panel === 'menu') document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [panel]);

  return (
    <header ref={header} className="sticky top-0 z-30">
      {/* The frosted glass is its own layer: a backdrop-filter on the header
          itself would shrink the fixed phone menu to the header's height */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
          scrolled || panel
            ? 'bg-cream-50/85 shadow-[0_1px_0_rgba(46,32,24,0.08)] backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      />
      <div className="relative mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:gap-4 sm:px-8 lg:h-20">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => togglePanel('menu')}
            aria-expanded={menuOpen}
            aria-controls="store-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="relative z-10 -ml-2 grid size-10 place-items-center rounded-full text-espresso-900 transition hover:bg-caramel-300/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tangerine-500 lg:hidden"
          >
            <StoreIcon name={menuOpen ? 'close' : 'menu'} className="size-6" />
          </button>
          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <Link
          to="/"
          onClick={closePanel}
          className="relative z-10 whitespace-nowrap py-2 font-display text-sm font-semibold uppercase tracking-[0.1em] text-espresso-900 min-[380px]:text-base min-[380px]:tracking-[0.12em] sm:text-2xl sm:tracking-[0.22em] lg:text-3xl"
        >
          <Wordmark />
        </Link>

        <div className="relative z-10 -mr-2 flex items-center justify-end text-espresso-900 sm:mr-0 sm:gap-2">
          <button
            type="button"
            onClick={() => togglePanel('search')}
            aria-expanded={searchOpen}
            aria-controls="store-search"
            aria-label={searchOpen ? 'Close search' : 'Search products'}
            className="grid size-10 place-items-center rounded-full transition hover:bg-caramel-300/40 hover:text-tangerine-700"
          >
            <StoreIcon name={searchOpen ? 'close' : 'search'} />
          </button>
          <Link
            to={account.to}
            aria-label={account.label}
            className="hidden size-10 place-items-center rounded-full transition hover:bg-caramel-300/40 hover:text-tangerine-700 sm:grid"
          >
            <StoreIcon name="account" />
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            aria-haspopup="dialog"
            aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}
            className="relative grid size-10 place-items-center rounded-full transition hover:bg-caramel-300/40 hover:text-tangerine-700"
          >
            <StoreIcon name="bag" />
            {count > 0 && (
              <span
                data-cart-count
                className="absolute -right-0.5 top-0 grid min-w-5 place-items-center rounded-full bg-ember px-1 text-[10px] font-semibold leading-5 text-white"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <StoreMenu
          links={NAV_LINKS}
          categories={categories}
          account={account}
          onClose={closePanel}
        />
      )}
      {searchOpen && <StoreSearch onClose={closePanel} />}
    </header>
  );
};

export default StoreHeader;
