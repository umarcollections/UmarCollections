import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useAuth from '../../hooks/auth/useAuth.js';
import { loginSchema } from '../../validators/auth/auth.schema.js';
import AdminButton from '../../components/admin/AdminButton.jsx';
import FormField from '../../components/common/FormField.jsx';
import FormAlert from '../../components/common/FormAlert.jsx';
import FullPageLoader from '../../components/common/FullPageLoader.jsx';
import Wordmark from '../../components/store/Wordmark.jsx';

const AdminLoginPage = () => {
  const { status, user, adminLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/admin/orders';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (status === 'loading') return <FullPageLoader label="Checking your session…" />;
  if (user?.role === 'admin') return <Navigate to={redirectTo} replace />;

  const onSubmit = async (values) => {
    try {
      await adminLogin(values);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <p className="mb-8 whitespace-nowrap font-display text-2xl font-semibold uppercase tracking-[0.2em] text-espresso-900">
        <Wordmark />
      </p>
      <div className="w-full max-w-sm rounded-2xl border border-caramel-300/60 bg-cream-50 p-8 shadow-lg shadow-espresso-900/5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-tangerine-700">
          Store admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-espresso-900">Sign in</h1>

        {user && (
          <p className="mt-3 text-sm text-espresso-700">
            You are signed in as {user.email}, which is not an admin account. Signing in here
            switches to the admin account.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <FormAlert message={errors.root?.message} />
          <FormField
            label="Email"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register('email')}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <AdminButton type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </AdminButton>
        </form>

        <Link
          to="/"
          className="mt-6 inline-block text-sm text-espresso-700 hover:text-espresso-900"
        >
          Back to the store
        </Link>
      </div>
    </div>
  );
};

export default AdminLoginPage;
