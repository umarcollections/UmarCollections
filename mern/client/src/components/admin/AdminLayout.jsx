import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import AdminIcon from './AdminIcon.jsx';
import Wordmark from '../store/Wordmark.jsx';
import useAuth from '../../hooks/auth/useAuth.js';
import useAdminOrders from '../../hooks/orders/useAdminOrders.js';

// Same params as the orders page's "Payment to check" filter, so both share one cached query
const TO_CHECK = { q: '', status: 'payment_submitted', page: 1 };

const NAV_LINKS = [
  { to: '/admin/orders', label: 'Orders', icon: 'orders' },
  {
    to: '/admin/products',
    label: 'Products',
    icon: 'products',
    children: [{ to: '/admin/categories', label: 'Categories' }],
  },
  { to: '/admin/customers', label: 'Customers', icon: 'customers' },
  { to: '/admin/discounts', label: 'Discounts', icon: 'discounts' },
];

// Icon only on phones, icon and text from sm up
const TOP_BAR_ACTION =
  'flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-lg px-2.5 text-sm text-cream-200 hover:bg-white/10 hover:text-white';

const itemClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-cream-50 text-espresso-900 shadow-sm ring-1 ring-caramel-300/70'
      : 'text-espresso-800 hover:bg-cream-50/70 hover:text-espresso-900'
  }`;

const subItemClass = ({ isActive }) =>
  `ml-8 block rounded-lg px-3 py-1.5 text-[13px] transition ${
    isActive
      ? 'bg-cream-50 font-semibold text-espresso-900 ring-1 ring-caramel-300/70'
      : 'text-espresso-700 hover:bg-cream-50/70 hover:text-espresso-900'
  }`;

// Icon tinted orange on the current section
const NavItem = ({ to, icon, label, badge }) => (
  <NavLink to={to} className={itemClass}>
    {({ isActive }) => (
      <>
        <AdminIcon
          name={icon}
          className={`size-5 shrink-0 ${isActive ? 'text-tangerine-600' : 'text-espresso-700'}`}
        />
        <span className="flex-1">{label}</span>
        {badge}
      </>
    )}
  </NavLink>
);

// Shopify-style admin: dark top bar, section list down the left, page on the right.
// On small screens the section list opens from the menu button.
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  // Remembers which page the menu was opened on, so any navigation (a link,
  // Back or Forward) closes it
  const [menuOpenOn, setMenuOpenOn] = useState(null);
  const menuOpen = menuOpenOn === pathname;
  const { data: toCheck } = useAdminOrders(TO_CHECK);
  const paymentsToCheck = toCheck?.pagination.total ?? 0;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event) => event.key === 'Escape' && setMenuOpenOn(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
  };

  return (
    <div className="min-h-screen bg-cream-100 text-espresso-800">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-espresso-900 px-3 text-cream-100 sm:px-5">
        <button
          type="button"
          onClick={() => setMenuOpenOn(menuOpen ? null : pathname)}
          aria-expanded={menuOpen}
          aria-controls="admin-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="grid size-10 place-items-center rounded-lg hover:bg-white/10 lg:hidden"
        >
          <AdminIcon name={menuOpen ? 'close' : 'menu'} />
        </button>
        <Link
          to="/admin/orders"
          className="flex items-center gap-3 whitespace-nowrap rounded-lg py-2 font-display text-lg font-semibold uppercase tracking-[0.16em] text-cream-50 sm:text-xl"
        >
          <Wordmark />
          <span className="hidden rounded-full bg-white/10 px-2.5 py-0.5 font-sans text-[10px] font-semibold tracking-[0.2em] text-caramel-300 sm:inline">
            Admin
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link to="/" className={TOP_BAR_ACTION}>
            <AdminIcon name="store" className="size-4" />
            <span className="max-sm:sr-only">View store</span>
          </Link>
          <span className="hidden items-center gap-2 px-2 text-sm text-cream-200 md:flex">
            <span className="grid size-8 place-items-center rounded-full bg-ember text-xs font-semibold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </span>
            {user?.name}
          </span>
          <button type="button" onClick={handleLogout} className={TOP_BAR_ACTION}>
            <AdminIcon name="logout" className="size-4" />
            <span className="max-sm:sr-only">Log out</span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setMenuOpenOn(null)}
          className="fixed inset-0 top-14 z-20 bg-espresso-900/40 lg:hidden"
        />
      )}

      <aside
        id="admin-nav"
        className={`${menuOpen ? 'flex' : 'hidden'} fixed bottom-0 left-0 top-14 z-30 w-64 flex-col overflow-y-auto border-r border-caramel-300/60 bg-cream-200 px-3 py-4 shadow-xl lg:flex lg:w-60 lg:shadow-none`}
      >
        <nav aria-label="Admin" className="flex-1">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavItem
                  {...link}
                  badge={
                    link.to === '/admin/orders' &&
                    paymentsToCheck > 0 && (
                      <span
                        title="Payments to check"
                        className="rounded-full bg-tangerine-700 px-2 py-0.5 text-[11px] font-semibold text-white"
                      >
                        {paymentsToCheck}
                        <span className="sr-only"> payments to check</span>
                      </span>
                    )
                  }
                />
                {link.children && (
                  <ul className="mt-1 space-y-1">
                    {link.children.map((child) => (
                      <li key={child.to}>
                        <NavLink to={child.to} className={subItemClass}>
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 border-t border-caramel-300/70 pt-3">
          <NavItem to="/admin/settings" icon="settings" label="Settings" />
        </div>
      </aside>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          {/* Keeps the admin frame on screen while the next page's code loads */}
          <Suspense fallback={<p className="text-sm text-espresso-700">Loading…</p>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
