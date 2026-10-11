import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import useAuth from '../../hooks/auth/useAuth.js';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import { useMyOrders } from '../../hooks/orders/useOrders.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';

const AccountPage = () => {
  const { user, logout } = useAuth();
  const { data: orders, error, isPending } = useMyOrders();
  usePageTitle('Your account');

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl text-espresso-900">Your account</h1>
          <p className="mt-1 text-sm text-espresso-700">
            {user.name}, {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-caramel-300 bg-cream-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso-900 transition hover:border-espresso-900"
        >
          Log out
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-3xl text-espresso-900">Your orders</h2>
        <p className="text-sm text-espresso-700">
          Orders placed while signed in. Orders placed as a guest open from the link shown after
          checkout.
        </p>

        {isPending && <p className="text-sm text-espresso-700">Loading your orders…</p>}
        {error && <p className="text-sm text-red-700">{error.message}</p>}
        {orders?.length === 0 && (
          <p className="py-6 text-espresso-800">
            No orders yet.{' '}
            <Link to="/shop" className="underline underline-offset-4">
              Browse products
            </Link>
          </p>
        )}

        {orders?.length > 0 && (
          <ul className="divide-y divide-caramel-300/50 border-y border-caramel-300/60">
            {orders.map((order) => (
              <li key={order._id}>
                <Link
                  to={`/orders/${order.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-cream-50/60"
                >
                  <span>
                    <span className="block font-medium text-espresso-900">
                      Order {order.orderNumber}
                    </span>
                    <span className="text-sm text-espresso-700">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <OrderStatusBadge status={order.status} />
                    <span className="tabular-nums text-espresso-900">
                      {formatPrice(order.total)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AccountPage;
