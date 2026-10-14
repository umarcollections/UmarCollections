import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import StoreIcon from './StoreIcon.jsx';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef(null);
  const account = accountLink(user);
  const closeMenu = () => setMenuOpen(false);

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

  // The menu's links slide in one after another
  useGSAP(
    () => {
      if (!menuOpen) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-menu-panel]', { autoAlpha: 0, duration: 0.4, ease: 'power2.out' });
        gsap.from('[data-menu-link]', {
          yPercent: 100,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power4.out',
          stagger: 0.06,
          delay: 0.1,
        });
      });
    },
    { scope: header, dependencies: [menuOpen], revertOnUpdate: true }
  );

  // While the menu is open the page behind it doesn't scroll, and Escape closes it
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header
      ref={header}
      className={`sticky top-0 z-30 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
        scrolled || menuOpen
          ? 'bg-cream-50/85 shadow-[0_1px_0_rgba(46,32,24,0.08)] backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:gap-4 sm:px-8 lg:h-20">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="store-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="relative z-10 -ml-2 grid size-10 place-items-center text-espresso-900 lg:hidden"
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
          onClick={closeMenu}
          className="relative z-10 whitespace-nowrap py-2 font-display text-sm font-semibold uppercase tracking-[0.1em] text-espresso-900 min-[380px]:text-base min-[380px]:tracking-[0.12em] sm:text-2xl sm:tracking-[0.22em] lg:text-3xl"
        >
          <Wordmark />
        </Link>

        <div className="relative z-10 -mr-2 flex items-center justify-end text-espresso-900 sm:mr-0 sm:gap-2">
          <Link
            to="/shop"
            aria-label="Search products"
            className="grid size-10 place-items-center rounded-full transition hover:bg-caramel-300/40 hover:text-tangerine-700"
          >
            <StoreIcon name="search" />
          </Link>
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
        <div
          id="store-menu"
          data-menu-panel
          className="fixed inset-0 z-0 overflow-y-auto bg-glow px-6 pb-12 pt-28 lg:hidden"
        >
          <nav aria-label="Main">
            <ul className="space-y-2">
              {[
                ...NAV_LINKS,
                ...categories.map((c) => ({ to: `/shop?category=${c.slug}`, label: c.name })),
              ].map((link) => (
                <li key={link.to} className="overflow-hidden">
                  <Link
                    data-menu-link
                    to={link.to}
                    onClick={closeMenu}
                    className="block font-display text-4xl text-espresso-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            to={account.to}
            onClick={closeMenu}
            className="mt-7 inline-block py-3 text-xs font-semibold uppercase tracking-[0.22em] text-espresso-900 underline underline-offset-8"
          >
            {account.label}
          </Link>
        </div>
      )}
    </header>
  );
};

export default StoreHeader;
