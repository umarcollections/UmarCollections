import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminButton from '../admin/AdminButton.jsx';
import FormAlert from '../common/FormAlert.jsx';
import FormField from '../common/FormField.jsx';
import { settingsFormSchema } from '../../validators/settings/settings.schema.js';

const BLANK_ACCOUNT = { bankName: '', accountTitle: '', accountNumber: '', iban: '' };

const toFormValues = (settings) => ({
  bankAccounts: settings.bankAccounts.map((account) => ({ ...BLANK_ACCOUNT, ...account })),
  shippingFee: String(settings.shippingFee),
  freeShippingThreshold:
    settings.freeShippingThreshold == null ? '' : String(settings.freeShippingThreshold),
  paymentWindowHours: String(settings.paymentWindowHours),
  heroHeading: settings.heroHeading,
  heroText: settings.heroText,
  announcement: settings.announcement,
});

const toPayload = (values) => ({
  bankAccounts: values.bankAccounts,
  shippingFee: Number(values.shippingFee),
  freeShippingThreshold:
    values.freeShippingThreshold === '' ? null : Number(values.freeShippingThreshold),
  paymentWindowHours: Number(values.paymentWindowHours),
  heroHeading: values.heroHeading,
  heroText: values.heroText,
  announcement: values.announcement,
});

// onSave receives the request body and resolves to the saved settings
const SettingsForm = ({ settings, onSave }) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: toFormValues(settings),
  });
  const accounts = useFieldArray({ control, name: 'bankAccounts' });

  const onSubmit = async (values) => {
    try {
      reset(toFormValues(await onSave(toPayload(values))));
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10" noValidate>
      <FormAlert message={errors.root?.message} />

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-espresso-900">Bank accounts</h2>
          <p className="mt-1 text-sm text-espresso-700">
            Customers see these after placing an order. Checkout stays closed until you add at least
            one.
          </p>
        </div>

        {accounts.fields.map((field, i) => (
          <div
            key={field.id}
            className="space-y-3 rounded-xl border border-caramel-300/60 bg-cream-50 shadow-sm p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Bank name"
                placeholder="Meezan Bank"
                error={errors.bankAccounts?.[i]?.bankName?.message}
                {...register(`bankAccounts.${i}.bankName`)}
              />
              <FormField
                label="Account title"
                error={errors.bankAccounts?.[i]?.accountTitle?.message}
                {...register(`bankAccounts.${i}.accountTitle`)}
              />
              <FormField
                label="Account number"
                error={errors.bankAccounts?.[i]?.accountNumber?.message}
                {...register(`bankAccounts.${i}.accountNumber`)}
              />
              <FormField
                label="IBAN (optional)"
                error={errors.bankAccounts?.[i]?.iban?.message}
                {...register(`bankAccounts.${i}.iban`)}
              />
            </div>
            <AdminButton variant="secondary" onClick={() => accounts.remove(i)}>
              Remove account
            </AdminButton>
          </div>
        ))}

        {accounts.fields.length < 5 && (
          <AdminButton variant="secondary" onClick={() => accounts.append(BLANK_ACCOUNT)}>
            Add bank account
          </AdminButton>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-espresso-900">Home page</h2>
          <p className="mt-1 text-sm text-espresso-700">
            Leave these empty to use the default wording. The hero photo is set above.
          </p>
        </div>
        <FormField
          label="Hero heading"
          placeholder="Clothing and bags for everyday wear"
          error={errors.heroHeading?.message}
          {...register('heroHeading')}
        />
        <FormField
          as="textarea"
          rows={2}
          label="Hero text"
          error={errors.heroText?.message}
          {...register('heroText')}
        />
        <FormField
          label="Announcement bar"
          hint="Shown above the header. When empty, the bar shows your free delivery amount, or nothing if free delivery is off."
          error={errors.announcement?.message}
          {...register('announcement')}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-espresso-900">Shipping and payment</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Shipping fee"
            inputMode="decimal"
            hint="0 for free shipping on every order"
            error={errors.shippingFee?.message}
            {...register('shippingFee')}
          />
          <FormField
            label="Free shipping from"
            inputMode="decimal"
            hint="Order subtotal; leave empty to turn off"
            error={errors.freeShippingThreshold?.message}
            {...register('freeShippingThreshold')}
          />
          <FormField
            label="Hours to pay"
            inputMode="numeric"
            hint="Unpaid orders are cancelled after this"
            error={errors.paymentWindowHours?.message}
            {...register('paymentWindowHours')}
          />
        </div>
      </section>

      <div className="flex items-center gap-4 border-t border-caramel-300/60 pt-6">
        <AdminButton type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Saving…' : 'Save settings'}
        </AdminButton>
        {!isDirty && <p className="text-sm text-espresso-700">No unsaved changes</p>}
      </div>
    </form>
  );
};

export default SettingsForm;
