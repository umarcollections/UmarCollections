import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import FormAlert from '../../components/common/FormAlert.jsx';
import StoreField from '../../components/store/StoreField.jsx';
import OrderSummary from '../../components/orders/OrderSummary.jsx';
import useAuth from '../../hooks/auth/useAuth.js';
import useCart from '../../hooks/cart/useCart.js';
import { useCartQuote, useCreateOrder } from '../../hooks/orders/useOrders.js';
import useSettings from '../../hooks/settings/useSettings.js';
import store from '../../lib/store.js';
import { checkoutSchema } from '../../validators/orders/checkout.schema.js';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import StoreButton from '../../components/store/StoreButton.jsx';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { items, discountCode, clear } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: quote, error: quoteError } = useCartQuote(items, discountCode);
  const { data: settings } = useSettings();
  const createOrder = useCreateOrder();
  usePageTitle('Checkout');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: '',
      address: '',
      city: store.city,
      postalCode: '',
      notes: '',
    },
  });

  // Once the order exists the cart is emptied; don't bounce to /cart on the way out
  if (!items.length && !createOrder.isSuccess) return <Navigate to="/cart" replace />;

  const onSubmit = async ({ name, email, phone, address, city, postalCode, notes }) => {
    try {
      const { order, key } = await createOrder.mutateAsync({
        items: items.map(({ productId, variantId, quantity }) => ({
          productId,
          variantId,
          quantity,
        })),
        ...(discountCode && { discountCode }),
        customer: { name, email, phone },
        shippingAddress: { address, city, postalCode },
        notes,
      });
      navigate(`/orders/${order.orderNumber}?key=${encodeURIComponent(key)}`, { replace: true });
      clear();
    } catch (err) {
      setError('root', { message: err.message });
      // Stock or prices moved; refresh the summary so the cart shows what changed
      if (err.status === 409) queryClient.invalidateQueries({ queryKey: ['cart-quote'] });
    }
  };

  const blocked = quote && (!quote.ready || !quote.checkoutOpen || Boolean(quote.discountError));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/cart" className="text-sm text-espresso-700 hover:text-espresso-900">
        Back to cart
      </Link>
      <h1 className="mt-2 font-display text-5xl text-espresso-900">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
          <FormAlert message={errors.root?.message} />

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-espresso-900">Contact</h2>
            <StoreField
              label="Full name"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <StoreField
                label="Email"
                type="email"
                autoComplete="email"
                hint="We send order updates here"
                error={errors.email?.message}
                {...register('email')}
              />
              <StoreField
                label="Phone"
                type="tel"
                autoComplete="tel"
                hint="For the delivery rider"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl text-espresso-900">Delivery address</h2>
            <p className="text-sm text-espresso-700">We deliver within {store.city} only.</p>
            <StoreField
              as="textarea"
              rows={3}
              label="Address"
              autoComplete="street-address"
              error={errors.address?.message}
              {...register('address')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <StoreField
                label="City"
                autoComplete="address-level2"
                error={errors.city?.message}
                {...register('city')}
              />
              <StoreField
                label="Postal code (optional)"
                autoComplete="postal-code"
                error={errors.postalCode?.message}
                {...register('postalCode')}
              />
            </div>
            <StoreField
              as="textarea"
              rows={2}
              label="Notes (optional)"
              hint="Anything the delivery rider should know"
              error={errors.notes?.message}
              {...register('notes')}
            />
          </section>

          <section className="space-y-2 border-t border-caramel-300/60 pt-6 text-sm text-espresso-800">
            <h2 className="font-display text-2xl text-espresso-900">Payment by bank transfer</h2>
            <p>
              After you place the order you will see our bank details. Transfer the total, then send
              us the transaction reference from your bank or app.
            </p>
            {settings && (
              <p>
                We hold your items for {settings.paymentWindowHours} hours. Orders not paid by then
                are cancelled.
              </p>
            )}
          </section>

          <StoreButton
            type="submit"
            disabled={isSubmitting || !quote || blocked}
            className="w-full"
          >
            {isSubmitting ? 'Placing order…' : 'Place order'}
          </StoreButton>
          <p className="text-xs text-espresso-700">
            By placing your order you agree to our{' '}
            <Link to="/terms" className="underline underline-offset-4">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
          {blocked && (
            <p className="text-sm text-red-700">
              {quote.checkoutOpen
                ? 'Something in your cart changed or your discount code no longer applies. Go back to the cart to review it.'
                : 'Checkout is not open yet.'}
            </p>
          )}
        </form>

        <aside className="h-fit">
          <h2 className="mb-3 font-display text-2xl text-espresso-900">Order summary</h2>
          {quoteError && !quote && <p className="text-sm text-red-700">{quoteError.message}</p>}
          {quote && (
            <OrderSummary
              lines={quote.lines
                .filter((line) => !line.problem)
                .map((line) => ({ ...line, key: line.variantId }))}
              subtotal={quote.subtotal}
              discount={quote.discount}
              shippingFee={quote.shippingFee}
              total={quote.total}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;
