import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnnouncementBar from './AnnouncementBar.jsx';
import CartDrawer from '../cart/CartDrawer.jsx';
import StoreFooter from './StoreFooter.jsx';
import StoreHeader from './StoreHeader.jsx';

// /login and /signup are one page whose panel slides between them, so moving
// between the two must not count as changing page
const AUTH_PATHS = new Set(['/login', '/signup']);
// How long to wait for a page's content before restoring its scroll position
const RESTORE_TIMEOUT_MS = 1500;

// Back and Forward return to where the visitor was on that page; a new page
// starts at the top. Positions are remembered per history entry.
const useScrollMemory = (page) => {
  const { key } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map());
  const currentKey = useRef(key);
  const lastPage = useRef(page);

  // The browser's own restoration fights the SPA, so it is turned off
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    const remember = () => positions.current.set(currentKey.current, window.scrollY);
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, []);

  useEffect(() => {
    currentKey.current = key;
    const pageChanged = lastPage.current !== page;
    lastPage.current = page;
    if (!pageChanged) return;

    const target = navigationType === 'POP' ? (positions.current.get(key) ?? 0) : 0;
    if (target === 0) {
      window.scrollTo(0, 0);
      return;
    }
    // Content may still be loading: wait until the page is tall enough
    const started = performance.now();
    let frame;
    const restore = () => {
      const tallEnough = document.documentElement.scrollHeight >= target + window.innerHeight;
      if (tallEnough || performance.now() - started > RESTORE_TIMEOUT_MS) {
        window.scrollTo(0, target);
        return;
      }
      frame = requestAnimationFrame(restore);
    };
    restore();
    return () => cancelAnimationFrame(frame);
  }, [key, page, navigationType]);
};

// Shell for every storefront page: each page rises in softly; the header and
// footer stay put.
const StoreLayout = () => {
  const { pathname } = useLocation();
  const page = AUTH_PATHS.has(pathname) ? 'auth' : pathname;
  const main = useRef(null);
  useScrollMemory(page);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          main.current,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            clearProps: 'transform',
            // Positions of scroll animations depend on the new page's height
            onComplete: () => ScrollTrigger.refresh(),
          }
        );
      });
    },
    { dependencies: [page], revertOnUpdate: true }
  );

  // Keyboard users can jump past the header straight to the page content
  const skipToContent = (event) => {
    event.preventDefault();
    main.current.focus();
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper text-espresso-900">
      <a
        href="#main"
        onClick={skipToContent}
        className="sr-only z-[60] rounded-full bg-espresso-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-cream-50 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <StoreHeader />
      <main ref={main} id="main" tabIndex={-1} className="flex-1 outline-none">
        <Suspense
          fallback={<p className="px-4 py-32 text-center text-sm text-espresso-700">Loading…</p>}
        >
          <Outlet />
        </Suspense>
      </main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
};

export default StoreLayout;
