import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import BankAccounts from '../../components/orders/BankAccounts.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import OrderSummary from '../../components/orders/OrderSummary.jsx';
import PaymentForm from '../../components/orders/PaymentForm.jsx';
import useAuth from '../../hooks/auth/useAuth.js';
import { useOrder } from '../../hooks/orders/useOrders.js';
import useSettings from '../../hooks/settings/useSettings.js';
import { formatDateTime, formatPrice } from '../../lib/format.js';
import store from '../../lib/store.js';
import usePageTitle from '../../hooks/common/usePageTitle.js';

const STATUS_MESSAGES = {
  confirmed: 'Payment confirmed. We are preparing your order.',
  shipped: 'Your order is on its way.',
  delivered: 'Your order has been delivered.',
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
  } catch {
    toast.error('Could not copy. Bookmark this page instead.');
  }
};

const OrderPage = () => {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key') ?? '';
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const { data: order, error, isPending } = useOrder(orderNumber, key, signedIn);
  const { data: settings } = useSettings();
  usePageTitle(`Order ${orderNumber}`);

  // Without a key only the signed-in customer who placed the order can open it
  const notFound = (!key && status === 'unauthenticated') || error?.status === 404;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {notFound && (
        <div className="py-12 text-center">
          <h1 className="font-display text-4xl text-espresso-900">Order not found</h1>
          <p className="mt-2 text-espresso-700">
            Use the full link from when you placed the order, or contact us on WhatsApp at{' '}
            {store.phone} or email {store.email} with your order number.
          </p>
        </div>
      )}
      {!notFound && isPending && <p className="text-sm text-espresso-700">Loading your order…</p>}
      {error && !notFound && <p className="text-sm text-red-700">{error.message}</p>}

      {order && (
        <div className="space-y-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-5xl text-espresso-900">Order {order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-sm text-espresso-700">
              Placed {formatDateTime(order.createdAt)}
            </p>
            {/* Only a link with the key works for someone who isn't signed in */}
            {key && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl border border-caramel-300/60 bg-cream-50 p-5 text-sm text-espresso-800">
                <p className="flex-1">
                  Save this page to check your order later. Anyone with the link can see it.
                </p>
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-full border border-caramel-300 bg-cream-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso-900 transition hover:border-espresso-900"
                >
                  Copy link
                </button>
              </div>
            )}
          </div>

          {order.status === 'awaiting_payment' && (
            <section className="space-y-5">
              {order.payment?.rejectionNote && (
                <div
                  role="alert"
                  className="border border-red-300 bg-red-50 p-4 text-sm text-red-800"
                >
                  We could not match your last payment: {order.payment.rejectionNote}
                </div>
              )}
              <div className="space-y-2 text-sm text-espresso-800">
                <h2 className="font-display text-3xl text-espresso-900">
                  Pay {formatPrice(order.total)} by bank transfer
                </h2>
                <p>
                  Transfer the total to one of the accounts below and write{' '}
                  <strong>order {order.orderNumber}</strong> in the transfer description if your
                  bank allows it. Then send us the transaction reference.
                </p>
                <p>
                  Please pay by <strong>{formatDateTime(order.paymentDueAt)}</strong>. Unpaid orders
                  are cancelled after that and the items go back on sale.
                </p>
              </div>
              <BankAccounts accounts={order.bankAccounts} />
              <div className="border-t border-caramel-300/60 pt-5">
                <h3 className="mb-3 font-display text-2xl text-espresso-900">I have paid</h3>
                <PaymentForm
                  orderNumber={orderNumber}
                  orderKey={key}
                  uploadsEnabled={Boolean(settings?.uploadsEnabled)}
                />
              </div>
            </section>
          )}

          {order.status === 'payment_submitted' && (
            <p className="rounded-3xl border border-caramel-300/60 bg-cream-50 p-5 text-sm text-espresso-800">
              We received your payment details on {formatDateTime(order.payment.submittedAt)}{' '}
              (reference {order.payment.reference}). We will confirm your order once the payment
              shows in our account.
            </p>
          )}

          {STATUS_MESSAGES[order.status] && (
            <div className="space-y-1 rounded-3xl border border-caramel-300/60 bg-cream-50 p-5 text-sm text-espresso-800">
              <p>{STATUS_MESSAGES[order.status]}</p>
              {order.shipment?.courier && <p>Courier: {order.shipment.courier}</p>}
              {order.shipment?.trackingNumber && (
                <p>Tracking number: {order.shipment.trackingNumber}</p>
              )}
            </div>
          )}

          {order.status === 'cancelled' && (
            <p className="rounded-3xl border border-caramel-300/60 bg-cream-50 p-5 text-sm text-espresso-800">
              This order was cancelled
              {order.history.at(-1)?.note ? `: ${order.history.at(-1).note}.` : '.'} If you think
              this is a mistake, WhatsApp us at {store.phone} or email {store.email}.
            </p>
          )}

          <section className="grid gap-8 md:grid-cols-[1fr_20rem]">
            <OrderSummary
              lines={order.items.map((item) => ({ ...item, key: item.variant }))}
              subtotal={order.subtotal}
              discount={order.discount}
              shippingFee={order.shippingFee}
              total={order.total}
            />
            <div className="space-y-1 text-sm text-espresso-800">
              <h2 className="mb-2 font-display text-2xl text-espresso-900">Delivery</h2>
              <p>{order.customer.name}</p>
              <p>{order.customer.phone}</p>
              <p className="whitespace-pre-line">{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city} {order.shippingAddress.postalCode}
              </p>
              {order.notes && <p className="pt-2 text-espresso-700">Notes: {order.notes}</p>}
            </div>
          </section>

          <Link
            to="/shop"
            className="inline-block text-sm text-espresso-700 hover:text-espresso-900"
          >
            Continue shopping
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
