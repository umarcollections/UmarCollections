import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard from '../../components/auth/AuthCard.jsx';
import AuthInput from '../../components/auth/AuthInput.jsx';
import FormAlert from '../../components/common/FormAlert.jsx';
import StoreButton from '../../components/store/StoreButton.jsx';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import { useForgotPassword } from '../../hooks/auth/usePasswordReset.js';
import { forgotPasswordSchema } from '../../validators/auth/auth.schema.js';
import store from '../../lib/store.js';

const ForgotPasswordPage = () => {
  usePageTitle('Forgot password');
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  if (forgot.isSuccess) {
    return (
      <AuthCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
          Check your email
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-espresso-900">
          We&apos;ve sent you a link
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-espresso-800">
          If {getValues('email')} has an account with us, an email is on its way with a link to
          choose a new password. The link works for 1 hour.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-espresso-800">
          Nothing after a few minutes? Check your spam folder, or WhatsApp us at {store.phone}.
        </p>
        <StoreButton to="/login" variant="outline" className="mt-8">
          Back to log in
        </StoreButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
        Forgot your password
      </p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-espresso-900">
        Choose a new one
      </h1>
      <p className="mt-3 text-sm text-espresso-800">
        Enter the email you signed up with and we&apos;ll send you a link.
      </p>

      <form
        onSubmit={handleSubmit(({ email }) => forgot.mutate(email))}
        className="mt-8 space-y-5"
        noValidate
      >
        <FormAlert message={forgot.error?.message} />
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <StoreButton type="submit" disabled={forgot.isPending} className="w-full">
          {forgot.isPending ? 'Sending…' : 'Send the link'}
        </StoreButton>
      </form>

      <p className="mt-8 text-sm text-espresso-800">
        Remembered it?{' '}
        <Link
          to="/login"
          className="inline-block py-2 font-semibold text-espresso-900 underline underline-offset-4"
        >
          Log in
        </Link>
      </p>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
