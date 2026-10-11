import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import CartLine from './CartLine.jsx';
import StoreButton from '../store/StoreButton.jsx';
import StoreIcon from '../store/StoreIcon.jsx';
import useCart from '../../hooks/cart/useCart.js';
import { useCartQuote } from '../../hooks/orders/useOrders.js';
import useSettings from '../../hooks/settings/useSettings.js';
import { formatPrice } from '../../lib/format.js';
import store from '../../lib/store.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])';

// How far the cart is from free delivery, judged on the goods after any
// discount, the same way the server decides it
const freeDeliveryProgress = (quote, settings) => {
  const threshold = settings?.freeShippingThreshold;
  if (threshold == null || !quote) return null;
  const spent = quote.subtotal - (quote.discount?.amount ?? 0);
  return {
    remaining: Math.max(0, threshold - spent),
    percent: Math.min(100, (spent / threshold) * 100),
  };
};

// Slides in from the right with the cart's items, live prices and stock from
// the server, a free delivery bar and the way to checkout. Opened from the
// header bag and after Add to cart; closes with Escape, the backdrop, the
// close button or when the page changes.
const CartDrawer = () => {
  const { items, discountCode, drawerOpen, closeDrawer, setQuantity, removeItem } = useCart();
  const { data: quote } = useCartQuote(items, discountCode);
  const { data: settings } = useSettings();
  const { pathname } = useLocation();
  const root = useRef(null);
  const panel = useRef(null);
  const firstRun = useRef(true);

  const remembered = new Map(items.map((item) => [item.variantId, item]));
  const progress = freeDeliveryProgress(quote, settings);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const blocked = !quote?.ready || !quote?.checkoutOpen || Boolean(quote?.discountError);

  // Following any link (product, checkout, cart page) closes the drawer
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // While open: no page scrolling behind it, Escape closes, Tab stays inside,
  // and focus goes back to where it was when it closes
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.activeElement;
    const focusables = () => [...panel.current.querySelectorAll(FOCUSABLE)];
    focusables()[0]?.focus();
    document.body.style.overflow = 'hidden';

    const onKey = (event) => {
      if (event.key === 'Escape') closeDrawer();
      if (event.key !== 'Tab') return;
      const list = focusables();
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [drawerOpen, closeDrawer]);

  useGSAP(
    () => {
      // The first run only puts things in their closed places
      const still =
        firstRun.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      firstRun.current = false;
      const d = still ? 0 : 1;

      if (drawerOpen) {
        // Visible straight away (not on the timeline's first tick) so focus can
        // move into the drawer as soon as it opens
        gsap.set(root.current, { autoAlpha: 1 });
        const timeline = gsap
          .timeline()
          .to('[data-drawer-backdrop]', { autoAlpha: 1, duration: 0.45 * d, ease: 'power2.out' }, 0)
          .to('[data-drawer-panel]', { xPercent: 0, duration: 0.8 * d, ease: 'power4.out' }, 0);
        // Items cascade in when they are already on screen (an empty cart has none)
        const itemsOnScreen = root.current.querySelectorAll('[data-drawer-item]');
        if (itemsOnScreen.length) {
          timeline.fromTo(
            itemsOnScreen,
            { x: 48, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: 0.6 * d, stagger: 0.07, ease: 'power3.out' },
            0.25 * d
          );
        }
      } else {
        gsap
          .timeline()
          .to('[data-drawer-panel]', { xPercent: 100, duration: 0.55 * d, ease: 'power3.in' }, 0)
          .to('[data-drawer-backdrop]', { autoAlpha: 0, duration: 0.45 * d }, 0.1 * d)
          .set(root.current, { autoAlpha: 0 });
      }
    },
    { scope: root, dependencies: [drawerOpen] }
  );

  // The free delivery bar grows to its new length when the cart changes
  useGSAP(
    () => {
      const bar = root.current.querySelector('[data-progress-bar]');
      if (!progress || !bar) return;
      gsap.to(bar, {
        width: `${progress.percent}%`,
        duration: firstRun.current ? 0 : 0.8,
        ease: 'power3.out',
      });
    },
    { scope: root, dependencies: [progress?.percent] }
  );

  return (
    <div ref={root} inert={!drawerOpen} className="invisible fixed inset-0 z-50">
      <div
        data-drawer-backdrop
        onClick={closeDrawer}
        aria-hidden="true"
        className="absolute inset-0 bg-espresso-900/40 opacity-0 backdrop-blur-[2px]"
      />

      <aside
        ref={panel}
        data-drawer-panel
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="bg-paper absolute inset-y-0 right-0 flex w-full max-w-md flex-col shadow-2xl shadow-espresso-900/30"
      >
        <header className="flex items-center justify-between border-b border-caramel-300/50 px-6 py-5">
          <h2 id="cart-drawer-title" className="font-display text-3xl text-espresso-900">
            Your cart{' '}
            {count > 0 && (
              <span className="align-middle text-sm font-semibold text-tangerine-700">
                ({count})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="grid size-10 place-items-center rounded-full text-espresso-900 transition hover:rotate-90 hover:bg-caramel-300/50"
          >
            <StoreIcon name="close" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-cream-200 text-caramel-700">
              <StoreIcon name="bag" className="size-8" />
            </span>
            <p className="font-display text-3xl text-espresso-900">Your cart is empty</p>
            <StoreButton to="/shop">Browse products</StoreButton>
          </div>
        ) : (
          <>
            {progress && (
              <div className="border-b border-caramel-300/50 px-6 py-4">
                <p className="text-xs font-medium text-espresso-800">
                  {progress.remaining > 0 ? (
                    <>
                      Add <strong>{formatPrice(progress.remaining)}</strong> more for free delivery
                    </>
                  ) : (
                    'Your order gets free delivery'
                  )}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-caramel-300/50">
                  <div data-progress-bar className="h-full w-0 rounded-full bg-ember" />
                </div>
              </div>
            )}

            <ul className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {(quote?.lines ?? []).map((line) => (
                <li key={line.variantId} data-drawer-item>
                  <CartLine
                    compact
                    line={line}
                    item={remembered.get(line.variantId)}
                    onQuantity={(quantity) => setQuantity(line.variantId, quantity)}
                    onRemove={() => removeItem(line.variantId)}
                    onNavigate={closeDrawer}
                  />
                </li>
              ))}
              {!quote && <li className="text-sm text-espresso-700">Checking prices and stock…</li>}
            </ul>

            {quote && (
              <footer className="space-y-4 border-t border-caramel-300/50 px-6 py-5">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-espresso-800">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums">{formatPrice(quote.subtotal)}</dd>
                  </div>
                  {quote.discount && (
                    <div className="flex justify-between text-espresso-800">
                      <dt>Discount ({quote.discount.code})</dt>
                      <dd className="tabular-nums">-{formatPrice(quote.discount.amount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-espresso-800">
                    <dt>Delivery</dt>
                    <dd className="tabular-nums">
                      {quote.shippingFee === 0 ? 'Free' : formatPrice(quote.shippingFee)}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-1 text-base font-semibold text-espresso-900">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatPrice(quote.total)}</dd>
                  </div>
                </dl>
                {!quote.ready && (
                  <p className="text-xs text-red-700">Update or remove the items marked above.</p>
                )}
                {quote.ready && !quote.checkoutOpen && (
                  <p className="text-xs text-espresso-800">
                    Checkout is not open yet. Please try again later, or WhatsApp us at{' '}
                    {store.phone}.
                  </p>
                )}
                {blocked ? (
                  <StoreButton disabled className="w-full">
                    Checkout
                  </StoreButton>
                ) : (
                  <StoreButton to="/checkout" className="w-full">
                    Checkout
                  </StoreButton>
                )}
                <StoreButton to="/cart" variant="outline" className="w-full">
                  View cart
                </StoreButton>
              </footer>
            )}
          </>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
