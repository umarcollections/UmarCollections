import { Link } from 'react-router-dom';
import Avatar from '../store/Avatar.jsx';
import StoreIcon from '../store/StoreIcon.jsx';

const ITEM =
  'flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tangerine-500';

// Profile card and section links for the account page.
// Mobile: 2x2 icon-card grid + full-width logout.
// Desktop lg+: sticky vertical list (unchanged).
// sections: [{ id, label, icon, count }]
const AccountSidebar = ({ user, sections, active, onLogout }) => (
  <aside className="min-w-0 rounded-[2rem] bg-cream-50 p-3 shadow-xl shadow-espresso-900/5 ring-1 ring-caramel-300/40 lg:sticky lg:top-28">
    <div className="flex items-center gap-4 p-3">
      <Avatar name={user.name} className="size-14 text-base" />
      <div className="min-w-0">
        <p className="truncate font-display text-2xl capitalize leading-tight text-espresso-900">
          {user.name}
        </p>
        <p className="truncate text-xs text-espresso-700">{user.email}</p>
      </div>
    </div>
    <div aria-hidden="true" className="mx-3 my-2 h-px bg-caramel-300/50" />

    <nav aria-label="Account sections">
      {/* ── Mobile: 2x2 icon-card grid ── */}
      <div className="lg:hidden">
        <ul className="grid grid-cols-2 gap-2">
          {sections.map((section) => {
            const current = section.id === active;
            return (
              <li key={section.id}>
                <Link
                  to={`#${section.id}`}
                  aria-current={current ? 'page' : undefined}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tangerine-500 ${
                    current
                      ? 'bg-espresso-900 text-cream-50 shadow-lg shadow-espresso-900/20'
                      : 'bg-cream-100 text-espresso-800 hover:bg-cream-200/80 hover:shadow-sm'
                  }`}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-xl ${
                      current ? 'bg-white/10' : 'bg-cream-50 shadow-sm ring-1 ring-caramel-300/50'
                    }`}
                  >
                    <StoreIcon
                      name={section.icon}
                      className={`size-5 ${current ? 'text-caramel-300' : 'text-espresso-700'}`}
                    />
                  </span>
                  <span className="leading-tight">{section.label}</span>
                  {section.count > 0 && (
                    <span
                      className={`absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                        current
                          ? 'bg-caramel-400 text-espresso-900'
                          : 'bg-espresso-900 text-cream-50'
                      }`}
                    >
                      {section.count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Full-width logout below the grid */}
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 hover:ring-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tangerine-500"
        >
          <StoreIcon name="logout" className="size-4" />
          Log out
        </button>
      </div>

      {/* ── Desktop: vertical sticky list ── */}
      <ul className="hidden lg:flex lg:flex-col lg:gap-1">
        {sections.map((section) => {
          const current = section.id === active;
          return (
            <li key={section.id} className="shrink-0">
              <Link
                to={`#${section.id}`}
                aria-current={current ? 'page' : undefined}
                className={`${ITEM} ${
                  current
                    ? 'bg-espresso-900 text-cream-50'
                    : 'text-espresso-900 hover:bg-cream-200/70'
                }`}
              >
                <StoreIcon
                  name={section.icon}
                  className={`size-5 ${current ? 'text-caramel-300' : 'text-espresso-700'}`}
                />
                <span className="flex-1">{section.label}</span>
                {section.count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      current ? 'bg-cream-50/15 text-cream-50' : 'bg-cream-200 text-espresso-800'
                    }`}
                  >
                    {section.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        <li className="mt-1 border-t border-caramel-300/50 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className={`${ITEM} w-full text-red-700 hover:bg-red-50`}
          >
            <StoreIcon name="logout" className="size-5" />
            Log out
          </button>
        </li>
      </ul>
    </nav>
  </aside>
);

export default AccountSidebar;
