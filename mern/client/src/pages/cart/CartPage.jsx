import DiscountCodeForm from '../../components/cart/DiscountCodeForm.jsx';
import CartLine from '../../components/cart/CartLine.jsx';
import useCart from '../../hooks/cart/useCart.js';
import { useCartQuote } from '../../hooks/orders/useOrders.js';
import { formatPrice } from '../../lib/format.js';
import store from '../../lib/store.js';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import StoreButton from '../../components/store/StoreButton.jsx';

// Prices, stock and totals shown here come from the server's quote, never
// from what the cart remembered when the item was added
const CartPage = () => {
  const { items, discountCode, setQuantity, removeItem } = useCart();
  const { data: quote, error, isPending, isFetching } = useCartQuote(items, discountCode);
  usePageTitle('Cart');
  const remembered = new Map(items.map((item) => [item.variantId, item]));

  if (!items.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-4xl text-espresso-900">Your cart is empty</h1>
        <StoreButton to="/shop" className="mt-8">
          Browse products
        </StoreButton>
      </div>
    );
  }

  // A code that doesn't apply must be removed first, so nobody pays more than they expect
  const blocked = !quote?.ready || !quote?.checkoutOpen || Boolean(quote?.discountError);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl text-espresso-900">Cart</h1>

      {isPending && <p className="mt-6 text-sm text-espresso-700">Checking prices and stock…</p>}
      {error && !quote && <p className="mt-6 text-sm text-red-700">{error.message}</p>}

      {quote && (
        <div
          className={`mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] ${isFetching ? 'opacity-70' : ''}`}
        >
          <ul className="divide-y divide-caramel-300/50 border-y border-caramel-300/50">
            {quote.lines.map((line) => (
              <li key={line.variantId} className="py-6">
                <CartLine
                  line={line}
                  item={remembered.get(line.variantId)}
                  onQuantity={(quantity) => setQuantity(line.variantId, quantity)}
                  onRemove={() => removeItem(line.variantId)}
                />
              </li>
            ))}
          </ul>

          <aside className="h-fit space-y-4 rounded-3xl border border-caramel-300/60 bg-cream-50 p-6">
            <DiscountCodeForm discount={quote.discount} discountError={quote.discountError} />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-espresso-700">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(quote.subtotal)}</dd>
              </div>
              {quote.discount && (
                <div className="flex justify-between">
                  <dt className="text-espresso-700">Discount ({quote.discount.code})</dt>
                  <dd className="tabular-nums">-{formatPrice(quote.discount.amount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-espresso-700">Shipping</dt>
                <dd className="tabular-nums">
                  {quote.shippingFee === 0 ? 'Free' : formatPrice(quote.shippingFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-caramel-300/60 pt-2 text-base font-semibold text-espresso-900">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(quote.total)}</dd>
              </div>
            </dl>

            {!quote.ready && (
              <p className="text-sm text-red-700">Update or remove the items marked above.</p>
            )}
            {quote.ready && !quote.checkoutOpen && (
              <p className="text-sm text-espresso-800">
                Checkout is not open yet. Please try again later, or WhatsApp us at {store.phone}.
              </p>
            )}

            {blocked ? (
              <StoreButton disabled className="w-full">
                Checkout
              </StoreButton>
            ) : (
              <StoreButton to="/checkout" className="w-full">
                Checkout
              </StoreButton>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default CartPage;
