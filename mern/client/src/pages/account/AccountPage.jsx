import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AccountSection from '../../components/account/AccountSection.jsx';
import AccountSidebar from '../../components/account/AccountSidebar.jsx';
import AddressBook from '../../components/account/AddressBook.jsx';
import ChangePasswordForm from '../../components/account/ChangePasswordForm.jsx';
import OrderList from '../../components/account/OrderList.jsx';
import ProfileForm from '../../components/account/ProfileForm.jsx';
import PageBanner from '../../components/store/PageBanner.jsx';
import useAuth from '../../hooks/auth/useAuth.js';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import useStoreMotion from '../../hooks/common/useStoreMotion.js';
import { useMyOrders } from '../../hooks/orders/useOrders.js';

// "bilal khawar" -> "Bilal"
const firstName = (name) => {
  const first = name.trim().split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
};

// One section is open at a time, chosen by the address (/account#addresses),
// so Back, refresh and the header menu's links all land on the right one
const AccountPage = () => {
  const { user, logout } = useAuth();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const page = useRef(null);
  const { data: orders, error, isPending } = useMyOrders();
  usePageTitle('Your account');
  useStoreMotion(page);

  const sections = [
    { id: 'orders', label: 'Orders', icon: 'orders', count: orders?.length },
    { id: 'details', label: 'Your details', icon: 'account' },
    { id: 'addresses', label: 'Addresses', icon: 'pin', count: user.addresses?.length },
    { id: 'password', label: 'Password', icon: 'lock' },
  ];
  const active = sections.find((section) => `#${section.id}` === hash)?.id ?? 'orders';
  // Accounts made with Google have no password until they set one
  const hasPassword = user.hasPassword !== false;

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/');
  };

  return (
    <div ref={page}>
      <PageBanner
        eyebrow="My account"
        title={`Hi, ${firstName(user.name)}`}
        text="Your orders, your details and saved addresses, all in one place."
      />

      <div className="relative mx-auto -mt-6 max-w-7xl px-4 pb-24 sm:px-8 lg:-mt-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start lg:gap-10">
          <AccountSidebar user={user} sections={sections} active={active} onLogout={handleLogout} />

          {active === 'orders' && (
            <AccountSection
              id="orders"
              eyebrow="Orders"
              title="Your orders"
              description="Orders placed while signed in. Orders placed as a guest open from the link in their confirmation email."
            >
              <OrderList orders={orders ?? []} error={error} isPending={isPending} />
            </AccountSection>
          )}

          {active === 'details' && (
            <AccountSection
              id="details"
              eyebrow="Profile"
              title="Your details"
              description="These fill in checkout for you, so ordering takes a moment."
            >
              <ProfileForm user={user} />
            </AccountSection>
          )}

          {active === 'addresses' && (
            <AccountSection
              id="addresses"
              eyebrow="Delivery"
              title="Saved addresses"
              description="Your default address fills checkout. You can pick another one there."
            >
              <AddressBook user={user} />
            </AccountSection>
          )}

          {active === 'password' && (
            <AccountSection
              id="password"
              eyebrow="Security"
              title={hasPassword ? 'Password' : 'Set a password'}
              description={
                hasPassword
                  ? 'Changing it signs you out on every other device. This one stays signed in.'
                  : 'You sign in with Google. Set a password to also log in with your email.'
              }
            >
              {user.role === 'admin' ? (
                <p className="text-sm text-espresso-800">
                  The admin password is set in the server settings (ADMIN_PASSWORD).
                </p>
              ) : (
                // key: a fresh form once a first password exists, so it asks for the current one
                <ChangePasswordForm key={String(hasPassword)} hasPassword={hasPassword} />
              )}
            </AccountSection>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
