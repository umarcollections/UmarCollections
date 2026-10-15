import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Avatar from './Avatar.jsx';
import StoreIcon from './StoreIcon.jsx';
import store, { whatsappLink } from '../../lib/store.js';

const ITEM =
  'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-tangerine-500';

const helpLink = `${whatsappLink}?text=${encodeURIComponent(`Hi ${store.name}, I need help with `)}`;

const Divider = () => <div aria-hidden="true" className="mx-3 my-1.5 h-px bg-caramel-300/50" />;

// Drops down from the profile button in the header. The header closes it on
// navigation, Escape and clicks outside; links simply navigate.
const AccountMenu = ({ user, onLogout }) => {
  const panel = useRef(null);
  const isAdmin = user.role === 'admin';

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(panel.current, {
          autoAlpha: 0,
          y: -8,
          scale: 0.97,
          duration: 0.25,
          ease: 'power2.out',
        });
      });
    },
    { scope: panel }
  );

  return (
    <div
      ref={panel}
      id="account-menu"
      className="absolute right-0 top-full z-40 mt-3 w-72 origin-top-right rounded-3xl border border-caramel-300/60 bg-cream-50 p-2 text-espresso-900 shadow-2xl shadow-espresso-900/15"
    >
      <div className="flex items-center gap-3 px-3 py-3">
        <Avatar name={user.name} className="size-11 text-sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold capitalize">{user.name}</p>
          <p className="truncate text-xs text-espresso-700">{user.email}</p>
        </div>
      </div>
      <Divider />
      <nav aria-label="Account">
        <ul>
          {isAdmin && (
            <li>
              <Link to="/admin" className={`${ITEM} hover:bg-cream-200/70`}>
                <StoreIcon name="admin" className="size-5 text-espresso-700" />
                Admin dashboard
              </Link>
            </li>
          )}
          <li>
            <Link to="/account" className={`${ITEM} hover:bg-cream-200/70`}>
              <StoreIcon name="account" className="size-5 text-espresso-700" />
              My account
            </Link>
          </li>
          <li>
            <Link to="/account#orders" className={`${ITEM} hover:bg-cream-200/70`}>
              <StoreIcon name="orders" className="size-5 text-espresso-700" />
              My orders
            </Link>
          </li>
        </ul>
      </nav>
      <Divider />
      <a
        href={helpLink}
        target="_blank"
        rel="noreferrer"
        className={`${ITEM} hover:bg-cream-200/70`}
      >
        <StoreIcon name="help" className="size-5 text-espresso-700" />
        <span className="flex-1">Help &amp; support</span>
        <span className="text-xs text-espresso-700">WhatsApp</span>
      </a>
      <Divider />
      <button
        type="button"
        onClick={onLogout}
        className={`${ITEM} font-medium text-red-700 hover:bg-red-50`}
      >
        <StoreIcon name="logout" className="size-5" />
        Log out
      </button>
    </div>
  );
};

export default AccountMenu;
