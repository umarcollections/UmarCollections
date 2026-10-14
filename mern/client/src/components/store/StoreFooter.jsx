import { Link } from 'react-router-dom';
import useCategories from '../../hooks/categories/useCategories.js';
import StoreIcon from './StoreIcon.jsx';
import Wordmark from './Wordmark.jsx';
import store, { mapsLink, phoneLink, whatsappLink } from '../../lib/store.js';

const HEADING = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-caramel-300';
const LINK = 'text-sm text-cream-200/80 transition hover:text-white';

const StoreFooter = () => {
  const { data: categories = [] } = useCategories();

  return (
    <footer className="bg-roast text-cream-100">
      <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm space-y-4">
            <p className="font-display text-3xl uppercase tracking-[0.2em] text-white">
              <Wordmark />
            </p>
            <p className="text-sm leading-relaxed text-cream-200/80">
              Clothing, bags, shoes and accessories for everyday wear, delivered within {store.city}
              . Sizes, fabrics and stock are listed on every product page.
            </p>
          </div>

          <nav aria-label="Shop" className="space-y-4">
            <p className={HEADING}>Shop</p>
            <ul className="space-y-3">
              <li>
                <Link to="/shop" className={LINK}>
                  All products
                </Link>
              </li>
              {categories.slice(0, 5).map((category) => (
                <li key={category._id}>
                  <Link to={`/shop?category=${category.slug}`} className={LINK}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Store" className="space-y-4">
            <p className={HEADING}>Store</p>
            <ul className="space-y-3">
              {[
                ['/about', 'About'],
                ['/collections', 'Collections'],
                ['/terms', 'Terms and Conditions'],
                ['/privacy', 'Privacy Policy'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className={LINK}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-4">
            <p className={HEADING}>Contact</p>
            <ul className="space-y-4 text-sm">
              {[
                { icon: 'mail', href: `mailto:${store.email}`, label: store.email },
                { icon: 'phone', href: phoneLink, label: store.phone },
                { icon: 'whatsapp', href: whatsappLink, label: 'WhatsApp us', external: true },
                { icon: 'pin', href: mapsLink, label: store.address, external: true },
              ].map((item) => (
                <li key={item.icon}>
                  <a
                    href={item.href}
                    {...(item.external && { target: '_blank', rel: 'noreferrer' })}
                    className={`${LINK} group flex items-start gap-3`}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/5 text-caramel-300 ring-1 ring-white/10 transition group-hover:bg-ember group-hover:text-white group-hover:ring-transparent">
                      <StoreIcon name={item.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 pt-1.5 leading-relaxed wrap-anywhere">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* The store name set very large across the full width */}
        <p
          aria-hidden="true"
          className="mt-20 select-none overflow-hidden whitespace-nowrap text-center font-display text-[6.4vw] uppercase leading-[0.8] tracking-[0.02em] text-ember xl:text-[5.4rem]"
        >
          {store.name}
        </p>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-cream-200/60 sm:px-8">
          &copy; {new Date().getFullYear()} {store.name}, {store.city}. Prices in {store.currency}.
        </p>
      </div>
    </footer>
  );
};

export default StoreFooter;
