import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import FormAlert from '../common/FormAlert.jsx';
import StoreButton from '../store/StoreButton.jsx';
import StoreField from '../store/StoreField.jsx';
import { useSaveAddress } from '../../hooks/account/useAccount.js';
import store from '../../lib/store.js';
import { addressSchema } from '../../validators/account/account.schema.js';

const LABEL_SUGGESTIONS = ['Home', 'Office'];

// Adds a new address, or edits `address` when given. New addresses start with
// the customer's name and phone, and the default city.
const AddressForm = ({ address, user, isFirst, onDone }) => {
  const saveAddress = useSaveAddress();
  const suggestionsId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: address?.label ?? '',
      name: address?.name ?? user.name,
      phone: address?.phone ?? user.phone ?? '',
      address: address?.address ?? '',
      city: address?.city ?? store.city,
      postalCode: address?.postalCode ?? '',
      isDefault: address?.isDefault ?? isFirst,
    },
  });

  const onSubmit = (values) =>
    saveAddress.mutate(
      { id: address?._id, ...values },
      {
        onSuccess: () => {
          toast.success(address ? 'Address updated' : 'Address saved');
          onDone();
        },
      }
    );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-3xl border border-caramel-300/60 bg-white/60 p-5"
      noValidate
    >
      <FormAlert message={saveAddress.error?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <StoreField
          label="Label (optional)"
          placeholder="Home, Office…"
          list={suggestionsId}
          error={errors.label?.message}
          {...register('label')}
        />
        <datalist id={suggestionsId}>
          {LABEL_SUGGESTIONS.map((label) => (
            <option key={label} value={label} />
          ))}
        </datalist>
        <StoreField
          label="Recipient's name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
      </div>
      <StoreField
        label="Phone"
        type="tel"
        autoComplete="tel"
        hint="For the delivery rider"
        error={errors.phone?.message}
        {...register('phone')}
      />
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
          hint={`We deliver within ${store.city} only`}
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
      {/* The default can only move to another address, never be switched off */}
      {address?.isDefault ? (
        <p className="text-sm text-espresso-700">This is your default delivery address.</p>
      ) : (
        <label className="flex items-center gap-3 py-1 text-sm text-espresso-900">
          <input
            type="checkbox"
            className="size-4 accent-espresso-900"
            {...register('isDefault')}
          />
          Use this as my default delivery address
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        <StoreButton type="submit" disabled={saveAddress.isPending}>
          {saveAddress.isPending ? 'Saving…' : address ? 'Save changes' : 'Save address'}
        </StoreButton>
        <StoreButton variant="outline" onClick={onDone}>
          Cancel
        </StoreButton>
      </div>
    </form>
  );
};

export default AddressForm;
