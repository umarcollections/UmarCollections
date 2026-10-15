import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import AuthInput from './AuthInput.jsx';
import GoogleButton from './GoogleButton.jsx';
import FormAlert from '../common/FormAlert.jsx';
import StoreButton from '../store/StoreButton.jsx';
import useAuth from '../../hooks/auth/useAuth.js';
import useGoogleSignIn from '../../hooks/auth/useGoogleSignIn.js';
import useShake from '../../hooks/auth/useShake.js';
import { loginSchema } from '../../validators/auth/auth.schema.js';

// afterSignIn(user): the address to go to once logged in. onSwitch shows the sign-up form;
// its link is only visible on small screens, where there is no sliding panel.
const LoginForm = ({ afterSignIn, onSwitch, active = true }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formRef, shake] = useShake();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const showError = useCallback(
    (message) => {
      setError('root', { message });
      shake();
    },
    [setError, shake]
  );
  const handleGoogle = useGoogleSignIn(afterSignIn, showError);

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(afterSignIn(user), { replace: true });
    } catch (err) {
      setError('root', { message: err.message });
      shake();
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
        Welcome back
      </p>
      <h1 className="mt-3 font-display text-5xl leading-none text-espresso-900">Log in</h1>
      <p className="mt-3 text-sm text-espresso-800">See your orders and check out faster.</p>

      {/* Only the form on screen has the Google button (one per page) */}
      {active && (
        <div className="mt-8">
          <GoogleButton onCredential={handleGoogle} />
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit, shake)}
        className="mt-6 space-y-5"
        noValidate
      >
        <FormAlert message={errors.root?.message} />
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthInput
          label="Password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="-mt-3 text-right">
          <Link
            to="/forgot-password"
            className="inline-block py-2 text-xs font-semibold text-espresso-800 underline underline-offset-4 hover:text-espresso-900"
          >
            Forgot password?
          </Link>
        </div>
        <StoreButton type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </StoreButton>
      </form>

      <p className="mt-8 text-sm text-espresso-800 md:hidden">
        New here?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="inline-block py-2 font-semibold text-espresso-900 underline underline-offset-4"
        >
          Create an account
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
