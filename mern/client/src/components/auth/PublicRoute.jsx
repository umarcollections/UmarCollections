import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/auth/useAuth.js';
import FullPageLoader from '../common/FullPageLoader.jsx';
import { afterSignInPath } from '../../lib/authRedirect.js';

// Login, signup and password pages, for signed-out visitors only. Someone
// signed in goes where a fresh login would take them, so this and the login
// form never send the visitor to two different places.
const PublicRoute = () => {
  const { status, user } = useAuth();
  const { state } = useLocation();

  if (status === 'loading') return <FullPageLoader label="Checking your session…" />;
  if (status === 'authenticated') {
    return <Navigate to={afterSignInPath(state, user)} replace />;
  }
  return <Outlet />;
};

export default PublicRoute;
