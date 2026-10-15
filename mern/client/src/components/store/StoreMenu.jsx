import { useRef } from 'react';
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import StoreIcon from './StoreIcon.jsx';
import store, { whatsappLink } from '../../lib/store.js';

// Frosted glass: see-through cream with a light edge. No blur filter, since the
// glow behind is already soft and a blur would cost frames on phones.
const GLASS = 'bg-cream-50/40 shadow-lg shadow-espresso-900/5 ring-1 ring-white/60';

const pageClass = ({ isActive }) =>
  `group flex items-center gap-5 py-4 font-display text-3xl transition-colors sm:text-4xl ${
    isActive ? 'text-tangerine-700' : 'text-espresso-900'
  }`;

const chipClass = (active) =>
  `inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium transition active:scale-95 ${
    active ? 'bg-espresso-900 text-cream-50' : `${GLASS} text-espresso-900 active:bg-cream-50/80`
  }`;

// A row in the glass card at the bottom: round icon, text, arrow. Pass `to` for
// a page, `href` for an outside link, or neither for a button.
const CardRow = ({ icon, iconClass, title, detail, ...props }) => {
  const Tag = props.to ? Link : props.href ? 'a' : 'button';
  return (
    <Tag
      {...(Tag === 'button' && { type: 'button' })}
      {...props}
      className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition active:bg-cream-50/60"
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${iconClass}`}>
        <StoreIcon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-espresso-900">{title}</span>
        {detail && <span className="block text-xs text-espresso-700">{detail}</span>}
      </span>
      <StoreIcon name="arrow" className="size-4 shrink-0 text-espresso-700" />
    </Tag>
  );
};

// Full-screen menu for phones and tablets: the main pages as numbered rows,
// categories as glass chips, and the account and WhatsApp in a card at the bottom.
// Signed-in customers also get their orders and Log out there.
const StoreMenu = ({ links, categories, account, user, onLogout, onClose }) => {
  const panel = useRef(null);
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const currentCategory = pathname === '/shop' ? searchParams.get('category') : null;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline()
          .from(panel.current, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' })
          .from(
            '[data-menu-link]',
            { yPercent: 100, autoAlpha: 0, duration: 0.7, ease: 'power4.out', stagger: 0.07 },
            0.1
          )
          .from(
            '[data-menu-line]',
            { scaleX: 0, duration: 0.9, ease: 'power3.inOut', stagger: 0.07 },
            0.15
          )
          .from(
            '[data-menu-fade]',
            { y: 16, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.035 },
            0.35
          );
      });
    },
    { scope: panel }
  );

  return (
    <div
      ref={panel}
      id="store-menu"
      className="fixed inset-0 z-0 flex flex-col overflow-y-auto overscroll-contain bg-glow px-6 pb-8 pt-28 sm:px-8 lg:hidden"
    >
      <nav aria-label="Main">
        <ul className="border-t border-espresso-900/10">
          {links.map((link, i) => (
            <li key={link.to} className="relative overflow-hidden">
              <NavLink data-menu-link to={link.to} onClick={onClose} className={pageClass}>
                <span className="w-5 font-sans text-[11px] font-semibold tracking-[0.2em] text-tangerine-700">
                  0{i + 1}
                </span>
                <span className="flex-1">{link.label}</span>
                <StoreIcon
                  name="arrow"
                  className="size-5 text-espresso-700 transition-transform group-active:translate-x-1"
                />
              </NavLink>
              <span
                data-menu-line
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-px origin-left bg-espresso-900/15"
              />
            </li>
          ))}
        </ul>
      </nav>

      {categories.length > 0 && (
        <nav aria-labelledby="menu-categories" className="mt-10">
          <p
            id="menu-categories"
            data-menu-fade
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-espresso-800"
          >
            Shop by category
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category._id} data-menu-fade>
                <Link
                  to={`/shop?category=${category.slug}`}
                  onClick={onClose}
                  aria-current={category.slug === currentCategory ? 'page' : undefined}
                  className={chipClass(category.slug === currentCategory)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div data-menu-fade className="mt-auto pt-10">
        <div className={`rounded-3xl p-2 ${GLASS}`}>
          <CardRow
            to={account.to}
            state={account.state}
            onClick={onClose}
            icon="account"
            iconClass="bg-espresso-900 text-cream-50"
            title={account.label}
            detail={user?.email}
          />
          <div aria-hidden="true" className="mx-3 h-px bg-espresso-900/10" />
          {user && (
            <>
              <CardRow
                to="/account#orders"
                onClick={onClose}
                icon="orders"
                iconClass="bg-cream-50 text-espresso-900"
                title="My orders"
              />
              <div aria-hidden="true" className="mx-3 h-px bg-espresso-900/10" />
            </>
          )}
          <CardRow
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            icon="whatsapp"
            iconClass="bg-[#128c7e] text-white"
            title="Chat on WhatsApp"
            detail={store.phone}
          />
          {user && (
            <>
              <div aria-hidden="true" className="mx-3 h-px bg-espresso-900/10" />
              <CardRow
                onClick={onLogout}
                icon="logout"
                iconClass="bg-red-50 text-red-700"
                title="Log out"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreMenu;
