import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useCart from '../../hooks/cart/useCart.js';
import { formatPrice } from '../../lib/format.js';
import { applyDiscountSchema } from '../../validators/discounts/discount.schema.js';

const describeError = (error) =>
  error.minSubtotal != null
    ? `Spend ${formatPrice(error.minSubtotal)} or more to use this code`
    : error.message;

// The code is kept with the cart; the quote says whether it applies and why not
const DiscountCodeForm = ({ discount, discountError }) => {
  const { discountCode, setDiscountCode } = useCart();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(applyDiscountSchema), defaultValues: { code: '' } });

  if (discountCode) {
    return (
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-espresso-900">Code {discountCode}</span>
          <button
            type="button"
            onClick={() => setDiscountCode('')}
            aria-label="Remove discount code"
            className="text-espresso-700 underline underline-offset-4 hover:text-espresso-900"
          >
            Remove
          </button>
        </div>
        {discount && <p className="text-green-800">Applied: -{formatPrice(discount.amount)}</p>}
        {discountError && <p className="text-red-700">{describeError(discountError)}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(({ code }) => {
        setDiscountCode(code);
        reset();
      })}
      className="space-y-1"
      noValidate
    >
      <label
        htmlFor="discount-code"
        className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso-800"
      >
        Discount code
      </label>
      <div className="relative">
        <input
          id="discount-code"
          autoComplete="off"
          aria-invalid={errors.code ? true : undefined}
          className="w-full rounded-full border border-caramel-300 bg-cream-100 px-5 py-3 pr-24 text-sm uppercase text-espresso-900 outline-none transition focus:border-caramel-500 focus:bg-white focus:ring-4 focus:ring-caramel-400/20"
          {...register('code')}
        />
        <button
          type="submit"
          className="absolute inset-y-1 right-1 rounded-full bg-caramel-300 px-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-espresso-900 transition hover:bg-caramel-400"
        >
          Apply
        </button>
      </div>
      {errors.code && <p className="text-xs text-red-700">{errors.code.message}</p>}
    </form>
  );
};

export default DiscountCodeForm;
