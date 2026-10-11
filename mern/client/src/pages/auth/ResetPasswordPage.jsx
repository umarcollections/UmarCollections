import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import AuthCard from '../../components/auth/AuthCard.jsx';
import AuthInput from '../../components/auth/AuthInput.jsx';
import FormAlert from '../../components/common/FormAlert.jsx';
import StoreButton from '../../components/store/StoreButton.jsx';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import { useResetPassword } from '../../hooks/auth/usePasswordReset.js';
import { PASSWORD_MIN, resetPasswordSchema } from '../../validators/auth/auth.schema.js';

// Opened from the link in the forgot-password email: /reset-password?token=...
const ResetPasswordPage = () => {
  usePageTitle('Choose a new password');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const resetPassword = useResetPassword(token);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = ({ password }) =>
    resetPassword.mutate(password, {
      onSuccess: ({ message }) => {
        toast.success(message);
        navigate('/login', { replace: true });
      },
    });

  return (
    <AuthCard>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
        Reset password
      </p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-espresso-900">
        Choose a new password
      </h1>

      {token ? (
        <>
          <p className="mt-3 text-sm text-espresso-800">
            This also signs you out on every other device.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <FormAlert message={resetPassword.error?.message} />
            <AuthInput
              label="New password"
              type="password"
              placeholder={`At least ${PASSWORD_MIN} characters`}
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <AuthInput
              label="New password again"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <StoreButton type="submit" disabled={resetPassword.isPending} className="w-full">
              {resetPassword.isPending ? 'Saving…' : 'Save new password'}
            </StoreButton>
          </form>
        </>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-espresso-800">
          This link is incomplete. Open the link from the email again, or ask for a new one.
        </p>
      )}

      {(!token || resetPassword.isError) && (
        <p className="mt-8 text-sm text-espresso-800">
          Link not working?{' '}
          <Link
            to="/forgot-password"
            className="inline-block py-2 font-semibold text-espresso-900 underline underline-offset-4"
          >
            Ask for a new one
          </Link>
        </p>
      )}
    </AuthCard>
  );
};

export default ResetPasswordPage;
