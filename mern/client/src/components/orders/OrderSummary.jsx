import { formatPrice } from '../../lib/format.js';

// Item list and totals. lines: [{ key, title, variantLabel, image, price, quantity }];
// discount: { code, amount } or null
const OrderSummary = ({ lines, subtotal, discount, shippingFee, total }) => (
  <div className="rounded-3xl border border-caramel-300/60 bg-cream-50">
    <ul className="divide-y divide-caramel-300/50">
      {lines.map((line) => (
        <li key={line.key} className="flex gap-4 p-4">
          <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-cream-200">
            {line.image && <img src={line.image} alt="" className="size-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-espresso-900">{line.title}</p>
            {line.variantLabel && <p className="text-espresso-700">{line.variantLabel}</p>}
            <p className="text-espresso-700">
              {line.quantity} x {formatPrice(line.price)}
            </p>
          </div>
          <p className="text-sm tabular-nums text-espresso-900">
            {formatPrice(line.price * line.quantity)}
          </p>
        </li>
      ))}
    </ul>
    <dl className="space-y-2 border-t border-caramel-300/60 p-4 text-sm">
      <div className="flex justify-between">
        <dt className="text-espresso-700">Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      {discount && (
        <div className="flex justify-between">
          <dt className="text-espresso-700">Discount ({discount.code})</dt>
          <dd className="tabular-nums">-{formatPrice(discount.amount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-espresso-700">Shipping</dt>
        <dd className="tabular-nums">{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</dd>
      </div>
      <div className="flex justify-between border-t border-caramel-300/60 pt-2 text-base font-semibold text-espresso-900">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatPrice(total)}</dd>
      </div>
    </dl>
  </div>
);

export default OrderSummary;
