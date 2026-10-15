import { useEffect, useRef, useState } from 'react';
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
import { checkoutFormSchema } from '../../validators/orders/checkout.schema.js';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import StoreButton from '../../components/store/StoreButton.jsx';

// Mirrors MAX_ADDRESSES in backend/src/models/user.model.js
const MAX_ADDRESSES = 5;
const NEW_ADDRESS = 'new';

const addressValues = (saved) => ({
  name: saved.name,
  phone: saved.phone,
  address: saved.address,
  city: saved.city,
  postalCode: saved.postalCode ?? '',
});

// Signed-in customers start with their default address and details filled in;
// with no saved address yet, "save this address" starts ticked
const checkoutDefaults = (user) => {
  const saved = user?.addresses?.find((address) => address.isDefault);
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: '',
    city: store.city,
    postalCode: '',
    ...(saved && addressValues(saved)),
    notes: '',
    saveAddress: Boolean(user) && !user.addresses?.length,
  };
};

const shortAddress = (saved) =>
  `${saved.label ? `${saved.label}: ` : ''}${saved.address}, ${saved.city}`;

const CheckoutPage = () => {
  const { user, refreshUser } = useAuth();
  const savedAddresses = user?.addresses ?? [];
  const [chosenAddress, setChosenAddress] = useState(
    () => savedAddresses.find((address) => address.isDefault)?._id ?? NEW_ADDRESS
  );
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
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: checkoutDefaults(user),
  });

  // On a fresh page load the login arrives after the form is drawn: fill it in
  // then, once per customer, so it never overwrites what they have typed
  const filledFor = useRef(user?._id);
  useEffect(() => {
    if (!user || filledFor.current === user._id) return;
    filledFor.current = user._id;
    reset(checkoutDefaults(user));
    setChosenAddress(user.addresses?.find((address) => address.isDefault)?._id ?? NEW_ADDRESS);
  }, [user, reset]);

  const chooseAddress = (id) => {
    setChosenAddress(id);
    const saved = savedAddresses.find((address) => address._id === id);
    const values = saved ? addressValues(saved) : { address: '', city: store.city, postalCode: '' };
    Object.entries(values).forEach(([field, value]) =>
      setValue(field, value, { shouldValidate: Boolean(saved) })
    );
    setValue('saveAddress', !saved && savedAddresses.length < MAX_ADDRESSES);
  };

  // Once the order exists the cart is emptied; don't bounce to /cart on the way out
  if (!items.length && !createOrder.isSuccess) return <Navigate to="/cart" replace />;

  const onSubmit = async ({
    name,
    email,
    phone,
    address,
    city,
    postalCode,
    notes,
    saveAddress,
  }) => {
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
        saveAddress: Boolean(user) && saveAddress,
      });
      // The account now has the new address; refresh it in the background
      if (user && saveAddress) refreshUser();
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
            {savedAddresses.length > 0 && (
              <StoreField
                as="select"
                label="Deliver to"
                value={chosenAddress}
                onChange={(event) => chooseAddress(event.target.value)}
              >
                {savedAddresses.map((saved) => (
                  <option key={saved._id} value={saved._id}>
                    {shortAddress(saved)}
                    {saved.isDefault ? ' (default)' : ''}
                  </option>
                ))}
                <option value={NEW_ADDRESS}>A new address</option>
              </StoreField>
            )}
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
            {user && chosenAddress === NEW_ADDRESS && savedAddresses.length < MAX_ADDRESSES && (
              <label className="flex items-center gap-3 py-1 text-sm text-espresso-900">
                <input
                  type="checkbox"
                  className="size-4 accent-espresso-900"
                  {...register('saveAddress')}
                />
                Save this address to my account
              </label>
            )}
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
