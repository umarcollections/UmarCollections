import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import AuthInput from './AuthInput.jsx';
import FormAlert from '../common/FormAlert.jsx';
import StoreButton from '../store/StoreButton.jsx';
import useAuth from '../../hooks/auth/useAuth.js';
import useShake from '../../hooks/auth/useShake.js';
import { PASSWORD_MIN, signupSchema } from '../../validators/auth/auth.schema.js';

// redirectTo: where to go once the account exists. onSwitch shows the login
// form; its link is only visible on small screens, where there is no sliding panel.
const SignupForm = ({ redirectTo, onSwitch }) => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formRef, shake] = useShake();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values) => {
    try {
      const user = await signup(values);
      toast.success(`Account created. Welcome, ${user.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('root', { message: err.message });
      shake();
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
        New here
      </p>
      <h1 className="mt-3 font-display text-5xl leading-none text-espresso-900">
        Create an account
      </h1>
      <p className="mt-3 text-sm text-espresso-800">
        Orders you place while signed in are listed in your account.
      </p>

      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit, shake)}
        className="mt-8 space-y-5"
        noValidate
      >
        <FormAlert message={errors.root?.message} />
        <AuthInput
          label="Full name"
          placeholder="Your name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
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
          placeholder={`At least ${PASSWORD_MIN} characters`}
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <StoreButton type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </StoreButton>
      </form>

      <p className="mt-8 text-sm text-espresso-800 md:hidden">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="inline-block py-2 font-semibold text-espresso-900 underline underline-offset-4"
        >
          Log in
        </button>
      </p>
    </div>
  );
};

export default SignupForm;
