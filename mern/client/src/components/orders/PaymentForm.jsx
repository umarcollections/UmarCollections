import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import StoreField from '../store/StoreField.jsx';
import FormAlert from '../common/FormAlert.jsx';
import { useSubmitPayment } from '../../hooks/orders/useOrders.js';
import { paymentSchema } from '../../validators/orders/checkout.schema.js';
import { IMAGE_TYPES, MAX_IMAGE_MB } from '../../validators/products/product.schema.js';
import StoreButton from '../store/StoreButton.jsx';

// uploadsEnabled is false until the store owner sets up image storage; the
// reference alone is still enough for them to find the payment
const PaymentForm = ({ orderNumber, orderKey, uploadsEnabled }) => {
  const submitPayment = useSubmitPayment(orderNumber, orderKey);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { reference: '' },
  });

  const onSubmit = async ({ reference, screenshot }) => {
    try {
      await submitPayment.mutateAsync({ reference, screenshot: screenshot?.[0] });
      toast.success('Payment details sent');
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormAlert message={errors.root?.message} />
      <StoreField
        label="Transaction reference"
        hint="The transaction ID or reference number from your bank or app receipt"
        error={errors.reference?.message}
        {...register('reference')}
      />
      {uploadsEnabled && (
        <StoreField
          label="Payment screenshot (optional)"
          type="file"
          accept={IMAGE_TYPES.join(',')}
          hint={`JPG, PNG or WebP, up to ${MAX_IMAGE_MB} MB`}
          error={errors.screenshot?.message}
          {...register('screenshot')}
        />
      )}
      <StoreButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send payment details'}
      </StoreButton>
    </form>
  );
};

export default PaymentForm;
