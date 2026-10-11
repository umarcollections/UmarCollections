const STATUSES = {
  awaiting_payment: { label: 'Awaiting payment', style: 'border-amber-600 text-amber-800' },
  payment_submitted: { label: 'Payment being checked', style: 'border-sky-700 text-sky-800' },
  confirmed: { label: 'Confirmed', style: 'border-green-700 text-green-800' },
  shipped: { label: 'Shipped', style: 'border-green-700 text-green-800' },
  delivered: { label: 'Delivered', style: 'border-espresso-700 text-espresso-800' },
  cancelled: { label: 'Cancelled', style: 'border-caramel-300 text-espresso-700' },
};

const OrderStatusBadge = ({ status }) => (
  <span
    className={`inline-block rounded-lg border px-2 py-0.5 text-xs font-medium ${STATUSES[status].style}`}
  >
    {STATUSES[status].label}
  </span>
);

export default OrderStatusBadge;
