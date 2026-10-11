import { Link, useParams } from 'react-router-dom';
import OrderActions from '../../components/orders/OrderActions.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import OrderSummary from '../../components/orders/OrderSummary.jsx';
import { useAdminOrder } from '../../hooks/orders/useAdminOrders.js';
import { formatDateTime } from '../../lib/format.js';

const Detail = ({ label, children }) => (
  <div>
    <dt className="text-xs text-espresso-700">{label}</dt>
    <dd className="text-sm text-espresso-900">{children}</dd>
  </div>
);

const AdminOrderPage = () => {
  const { id } = useParams();
  const { data: order, error, isPending } = useAdminOrder(id);
  const { payment, shipment } = order ?? {};

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <Link to="/admin/orders" className="text-sm text-espresso-700 hover:text-espresso-900">
          Back to orders
        </Link>
        {order && (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-semibold text-espresso-900">
                Order {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-sm text-espresso-700">
              Placed {formatDateTime(order.createdAt)}
              {order.user ? ' by a registered customer' : ' as a guest'}
            </p>
          </>
        )}
      </div>

      {isPending && <p className="text-sm text-espresso-700">Loading order…</p>}
      {error && <p className="text-sm text-red-700">{error.message}</p>}

      {order && (
        <>
          <OrderActions order={order} />

          <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-8">
              <OrderSummary
                lines={order.items.map((item) => ({
                  ...item,
                  key: item.variant,
                  variantLabel: [item.variantLabel, item.sku && `SKU ${item.sku}`]
                    .filter(Boolean)
                    .join(', '),
                }))}
                subtotal={order.subtotal}
                discount={order.discount}
                shippingFee={order.shippingFee}
                total={order.total}
              />

              <section className="space-y-3">
                <h2 className="font-semibold text-espresso-900">Payment</h2>
                <dl className="grid gap-3 rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-4 sm:grid-cols-2">
                  {order.status === 'awaiting_payment' && (
                    <Detail label="Pay by">{formatDateTime(order.paymentDueAt)}</Detail>
                  )}
                  <Detail label="Reference from customer">
                    {payment?.reference ?? 'Not sent yet'}
                  </Detail>
                  {payment?.submittedAt && (
                    <Detail label="Sent">{formatDateTime(payment.submittedAt)}</Detail>
                  )}
                  {payment?.confirmedAt && (
                    <Detail label="Confirmed">{formatDateTime(payment.confirmedAt)}</Detail>
                  )}
                  {payment?.rejectionNote && (
                    <Detail label="Last rejection">{payment.rejectionNote}</Detail>
                  )}
                </dl>
                {payment?.screenshot?.url && (
                  <a
                    href={payment.screenshot.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-48 rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-1 hover:border-espresso-900"
                  >
                    <img src={payment.screenshot.url} alt="Payment screenshot from the customer" />
                    <span className="mt-1 block text-xs text-espresso-700">Open full size</span>
                  </a>
                )}
              </section>

              {shipment?.shippedAt && (
                <section className="space-y-3">
                  <h2 className="font-semibold text-espresso-900">Shipment</h2>
                  <dl className="grid gap-3 rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-4 sm:grid-cols-3">
                    <Detail label="Shipped">{formatDateTime(shipment.shippedAt)}</Detail>
                    <Detail label="Courier">{shipment.courier || 'Not given'}</Detail>
                    <Detail label="Tracking number">
                      {shipment.trackingNumber || 'Not given'}
                    </Detail>
                  </dl>
                </section>
              )}
            </div>

            <aside className="space-y-8">
              <section className="space-y-3">
                <h2 className="font-semibold text-espresso-900">Customer</h2>
                <dl className="space-y-3 rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-4">
                  <Detail label="Name">{order.customer.name}</Detail>
                  <Detail label="Email">
                    <a href={`mailto:${order.customer.email}`} className="break-all underline">
                      {order.customer.email}
                    </a>
                  </Detail>
                  <Detail label="Phone">
                    <a
                      href={`tel:${order.customer.phone.replace(/[^\d+]/g, '')}`}
                      className="underline"
                    >
                      {order.customer.phone}
                    </a>
                  </Detail>
                  <Detail label="Address">
                    <span className="whitespace-pre-line">{order.shippingAddress.address}</span>
                    <br />
                    {order.shippingAddress.city} {order.shippingAddress.postalCode}
                  </Detail>
                  {order.notes && <Detail label="Notes">{order.notes}</Detail>}
                </dl>
              </section>

              <section className="space-y-3">
                <h2 className="font-semibold text-espresso-900">History</h2>
                <ol className="space-y-3 border-l border-caramel-300 pl-4">
                  {order.history.map((entry, i) => (
                    <li key={`${entry.status}-${i}`} className="text-sm">
                      <OrderStatusBadge status={entry.status} />
                      <p className="mt-1 text-xs text-espresso-700">{formatDateTime(entry.at)}</p>
                      {entry.note && <p className="text-espresso-800">{entry.note}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrderPage;
