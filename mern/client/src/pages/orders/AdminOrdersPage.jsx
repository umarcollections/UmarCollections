import { Link, useSearchParams } from 'react-router-dom';
import AdminButton from '../../components/admin/AdminButton.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import useAdminOrders from '../../hooks/orders/useAdminOrders.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';

// Ordered by what needs the admin's attention first
const STATUS_FILTERS = [
  { value: '', label: 'All orders' },
  { value: 'payment_submitted', label: 'Payment to check' },
  { value: 'confirmed', label: 'To ship' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CONTROL_CLASS =
  'rounded-lg border border-caramel-300 bg-white px-3 py-2 text-sm outline-none focus:border-caramel-500 focus:ring-1 focus:ring-caramel-500';

const AdminOrdersPage = () => {
  // Filters live in the URL so the back button and shared links keep them
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page')) || 1;

  const { data, error, isPending, isFetching, refetch } = useAdminOrders({ q, status, page });

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key)
    );
    setSearchParams(next);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ q: event.currentTarget.elements.q.value.trim(), page: '' });
  };

  const orders = data?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-semibold text-espresso-900">Orders</h1>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} role="search" className="flex min-w-[16rem] flex-1 gap-2">
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <input
            id="order-search"
            name="q"
            type="search"
            defaultValue={q}
            key={q}
            placeholder="Order number, name, email or phone"
            className={`w-full min-w-0 ${CONTROL_CLASS}`}
          />
          <AdminButton type="submit" variant="secondary">
            Search
          </AdminButton>
        </form>
        <label htmlFor="order-status" className="sr-only">
          Filter by status
        </label>
        <select
          id="order-status"
          value={status}
          onChange={(event) => updateParams({ status: event.target.value, page: '' })}
          className={CONTROL_CLASS}
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {isPending && <p className="text-sm text-espresso-700">Loading orders…</p>}

      {error && !data && (
        <div className="space-y-3">
          <p className="text-sm text-red-700">{error.message}</p>
          <AdminButton variant="secondary" onClick={() => refetch()}>
            Try again
          </AdminButton>
        </div>
      )}

      {data && orders.length === 0 && (
        <p className="border border-dashed border-caramel-300 px-6 py-12 text-center text-espresso-800">
          {q || status ? 'No orders match these filters.' : 'No orders yet.'}
        </p>
      )}

      {orders.length > 0 && (
        <div
          className={`relative overflow-x-auto rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm ${isFetching ? 'opacity-70' : ''}`}
        >
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-caramel-300/60 bg-cream-100 text-espresso-700">
              <tr>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Placed</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-caramel-300/60">
              {orders.map((order) => (
                <tr key={order._id} className="relative hover:bg-cream-100">
                  <td className="px-3 py-2">
                    {/* The link stretches over the whole row, so a click anywhere opens
                        the order and it still opens in a new tab like any link */}
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="font-medium text-espresso-900 after:absolute after:inset-0 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-espresso-700">{formatDateTime(order.createdAt)}</td>
                  <td className="px-3 py-2">
                    <p className="text-espresso-900">{order.customer.name}</p>
                    <p className="text-xs text-espresso-700">{order.shippingAddress.city}</p>
                  </td>
                  <td className="px-3 py-2">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-espresso-900">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <Pagination
          {...data.pagination}
          onChange={(next) => updateParams({ page: next > 1 ? String(next) : '' })}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
