import { Link } from 'react-router-dom';
import EmptyState from './EmptyState.jsx';
import OrderStatusBadge from '../orders/OrderStatusBadge.jsx';
import StoreButton from '../store/StoreButton.jsx';
import StoreIcon from '../store/StoreIcon.jsx';
import { formatDateTime, formatPrice } from '../../lib/format.js';

const itemCount = (order) => order.items.reduce((sum, item) => sum + item.quantity, 0);

// The customer's orders, newest first, each opening its order page
const OrderList = ({ orders, error, isPending }) => {
  if (isPending) return <p className="text-sm text-espresso-700">Loading your orders…</p>;
  if (error) return <p className="text-sm text-red-700">{error.message}</p>;
  if (!orders.length) {
    return (
      <EmptyState
        icon="bag"
        title="No orders yet"
        text="When you order while signed in, it shows up here with its status and payment details."
      >
        <StoreButton to="/shop">Start shopping</StoreButton>
      </EmptyState>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const count = itemCount(order);
        return (
          <li key={order._id}>
            <Link
              to={`/orders/${order.orderNumber}`}
              className="group flex items-center gap-4 rounded-3xl border border-caramel-300/60 bg-white/50 p-4 transition hover:border-espresso-900/30 hover:bg-white"
            >
              <span className="size-16 shrink-0 overflow-hidden rounded-2xl bg-cream-200">
                {order.items[0]?.image && (
                  <img src={order.items[0].image} alt="" className="size-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-2xl leading-tight text-espresso-900">
                  Order {order.orderNumber}
                </span>
                <span className="block text-xs text-espresso-700">
                  {formatDateTime(order.createdAt)} · {count} {count === 1 ? 'item' : 'items'}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-3 sm:hidden">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm font-semibold tabular-nums text-espresso-900">
                    {formatPrice(order.total)}
                  </span>
                </span>
              </span>
              <span className="hidden items-center gap-5 sm:flex">
                <OrderStatusBadge status={order.status} />
                <span className="w-24 text-right text-sm font-semibold tabular-nums text-espresso-900">
                  {formatPrice(order.total)}
                </span>
              </span>
              <StoreIcon
                name="arrow"
                className="size-4 shrink-0 text-espresso-700 transition group-hover:translate-x-1"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default OrderList;
