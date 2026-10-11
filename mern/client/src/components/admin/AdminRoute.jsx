import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/auth/useAuth.js';
import FullPageLoader from '../common/FullPageLoader.jsx';

// Admin pages: anyone who isn't signed in as an admin goes to the admin
// sign-in and comes back here afterwards. The API checks the role too.
const AdminRoute = () => {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader label="Checking your session…" />;
  if (user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
};

export default AdminRoute;
