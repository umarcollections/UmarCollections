import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminButton from '../admin/AdminButton.jsx';
import FormAlert from '../common/FormAlert.jsx';
import FormField from '../common/FormField.jsx';
import { discountFormSchema } from '../../validators/discounts/discount.schema.js';

const pad = (n) => String(n).padStart(2, '0');

// A code "expires on" a day and works until the end of that day, shop time
const toDateInput = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const endOfDay = (day) => (day ? new Date(`${day}T23:59:59.999`).toISOString() : null);

const toFormValues = (discount) => ({
  code: discount?.code ?? '',
  type: discount?.type ?? 'percentage',
  value: discount ? String(discount.value) : '',
  minSubtotal: discount?.minSubtotal ? String(discount.minSubtotal) : '',
  expiresOn: toDateInput(discount?.expiresAt),
  usageLimit: discount?.usageLimit ? String(discount.usageLimit) : '',
  active: discount?.active ?? true,
});

const toPayload = (values) => ({
  code: values.code,
  type: values.type,
  value: Number(values.value),
  minSubtotal: values.minSubtotal ? Number(values.minSubtotal) : 0,
  expiresAt: endOfDay(values.expiresOn),
  usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
  active: values.active,
});

// Adds a code, or edits one in place. onSave receives the request body and
// resolves when saved or throws; a new code clears the form afterwards.
const DiscountForm = ({ discount, onSave, onCancel, submitLabel }) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(discountFormSchema),
    defaultValues: toFormValues(discount),
  });
  const type = useWatch({ control, name: 'type' });

  const onSubmit = async (values) => {
    try {
      await onSave(toPayload(values));
      if (!discount) reset(toFormValues());
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormAlert message={errors.root?.message} />
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Code"
          placeholder="EID20"
          hint="Saved in capitals"
          error={errors.code?.message}
          {...register('code')}
        />
        <FormField as="select" label="Type" {...register('type')}>
          <option value="percentage">Percentage off</option>
          <option value="fixed">Fixed amount off</option>
        </FormField>
        <FormField
          label={type === 'percentage' ? 'Percent off' : 'Amount off'}
          inputMode="decimal"
          placeholder={type === 'percentage' ? '10' : '500'}
          error={errors.value?.message}
          {...register('value')}
        />
        <FormField
          label="Minimum subtotal (optional)"
          inputMode="decimal"
          error={errors.minSubtotal?.message}
          {...register('minSubtotal')}
        />
        <FormField
          label="Expires on (optional)"
          type="date"
          hint="Works until the end of this day"
          error={errors.expiresOn?.message}
          {...register('expiresOn')}
        />
        <FormField
          label="Usage limit (optional)"
          inputMode="numeric"
          hint="Total orders that can use it"
          error={errors.usageLimit?.message}
          {...register('usageLimit')}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-espresso-800">
        <input type="checkbox" className="size-4 accent-espresso-900" {...register('active')} />
        Active (customers can use it)
      </label>
      <div className="flex gap-2">
        <AdminButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </AdminButton>
        {onCancel && (
          <AdminButton variant="secondary" onClick={onCancel}>
            Cancel
          </AdminButton>
        )}
      </div>
    </form>
  );
};

export default DiscountForm;
