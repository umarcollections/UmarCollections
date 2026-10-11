import { Link, useParams } from 'react-router-dom';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import { useAdminCustomer } from '../../hooks/customers/useAdminCustomers.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';

const Stat = ({ label, children }) => (
  <div className="rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-4">
    <p className="text-xs text-espresso-700">{label}</p>
    <p className="mt-1 text-lg font-semibold tabular-nums text-espresso-900">{children}</p>
  </div>
);

const AdminCustomerPage = () => {
  const { email } = useParams();
  const { data: customer, error, isPending } = useAdminCustomer(email);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <Link to="/admin/customers" className="text-sm text-espresso-700 hover:text-espresso-900">
          Back to customers
        </Link>
        {customer && (
          <>
            <h1 className="mt-2 font-display text-4xl font-semibold text-espresso-900">
              {customer.name}
            </h1>
            <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-espresso-700">
              <a href={`mailto:${customer.email}`} className="underline">
                {customer.email}
              </a>
              <a href={`tel:${customer.phone.replace(/[^\d+]/g, '')}`} className="underline">
                {customer.phone}
              </a>
              <span>{customer.registered ? 'Has an account' : 'Guest checkout only'}</span>
            </p>
          </>
        )}
      </div>

      {isPending && <p className="text-sm text-espresso-700">Loading customer…</p>}
      {error && <p className="text-sm text-red-700">{error.message}</p>}

      {customer && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Orders">{customer.orders}</Stat>
            <Stat label="Paid (confirmed orders)">{formatPrice(customer.paid)}</Stat>
            <Stat label="Customer since">{formatDateTime(customer.firstOrderAt)}</Stat>
          </div>

          <section className="space-y-3">
            <h2 className="font-semibold text-espresso-900">Orders</h2>
            <div className="relative overflow-x-auto rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="border-b border-caramel-300/60 bg-cream-100 text-espresso-700">
                  <tr>
                    <th className="px-3 py-2 font-medium">Order</th>
                    <th className="px-3 py-2 font-medium">Placed</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-caramel-300/60">
                  {customer.orderList.map((order) => (
                    <tr key={order._id} className="hover:bg-cream-100">
                      <td className="px-3 py-2">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="font-medium text-espresso-900 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-espresso-700">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminCustomerPage;
