import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import AuthInput from '../auth/AuthInput.jsx';
import FormAlert from '../common/FormAlert.jsx';
import StoreButton from '../store/StoreButton.jsx';
import { useChangePassword } from '../../hooks/account/useAccount.js';
import { PASSWORD_MIN } from '../../validators/auth/auth.schema.js';
import {
  changePasswordSchema,
  setPasswordSchema,
} from '../../validators/account/account.schema.js';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Changing the password signs out every other device; this one stays signed in.
// hasPassword is false for accounts made with Google: they set a first password
// without a current one.
const ChangePasswordForm = ({ hasPassword }) => {
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(hasPassword ? changePasswordSchema : setPasswordSchema),
    defaultValues: EMPTY,
  });

  const onSubmit = ({ currentPassword, newPassword }) =>
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          reset(EMPTY);
          toast.success(
            hasPassword
              ? 'Password changed. Other devices have been signed out.'
              : 'Password set. You can now also log in with your email.'
          );
        },
      }
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      <FormAlert message={changePassword.error?.message} />
      {hasPassword && (
        <AuthInput
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
      )}
      <AuthInput
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder={`At least ${PASSWORD_MIN} characters`}
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <AuthInput
        label="New password again"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <StoreButton type="submit" disabled={changePassword.isPending}>
        {changePassword.isPending ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
      </StoreButton>
    </form>
  );
};

export default ChangePasswordForm;
