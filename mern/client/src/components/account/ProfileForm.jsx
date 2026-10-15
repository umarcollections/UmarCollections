import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import FormAlert from '../common/FormAlert.jsx';
import StoreButton from '../store/StoreButton.jsx';
import StoreField from '../store/StoreField.jsx';
import StoreIcon from '../store/StoreIcon.jsx';
import { useUpdateProfile } from '../../hooks/account/useAccount.js';
import { profileSchema } from '../../validators/account/account.schema.js';

// Name and phone can change here. The email is the login, so it is shown but
// not editable: changing it safely needs a confirmation email first.
const ProfileForm = ({ user }) => {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone ?? '' },
  });

  const onSubmit = (values) =>
    updateProfile.mutate(values, {
      onSuccess: ({ data }) => {
        reset({ name: data.name, phone: data.phone });
        toast.success('Your details are saved');
      },
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormAlert message={updateProfile.error?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <StoreField
          label="Full name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <StoreField
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="0300 1234567"
          hint="Fills checkout for you"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>
      <div className="flex items-start gap-4 rounded-3xl bg-cream-100 px-5 py-4">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-cream-50 text-espresso-700">
          <StoreIcon name="mail" className="size-4" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso-800">
            Login email
          </p>
          <p className="mt-1 truncate text-espresso-900">{user.email}</p>
          {user.googleConnected && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cream-50 px-2.5 py-1 text-[11px] font-semibold text-espresso-800">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-green-600" />
              Connected with Google
            </p>
          )}
          <p className="mt-1 text-xs text-espresso-700">
            To change it, WhatsApp or email us so we can confirm it is you.
          </p>
        </div>
      </div>
      <StoreButton type="submit" variant="dark" disabled={!isDirty || updateProfile.isPending}>
        {updateProfile.isPending ? 'Saving…' : 'Save changes'}
      </StoreButton>
    </form>
  );
};

export default ProfileForm;
