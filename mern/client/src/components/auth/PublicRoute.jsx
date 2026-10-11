import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/auth/useAuth.js';
import FullPageLoader from '../common/FullPageLoader.jsx';

// Login and signup pages: signed-in customers go to their account, admins to the admin
const PublicRoute = () => {
  const { status, user } = useAuth();

  if (status === 'loading') return <FullPageLoader label="Checking your session…" />;
  if (status === 'authenticated') {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/account'} replace />;
  }
  return <Outlet />;
};

export default PublicRoute;
