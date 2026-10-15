import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useAuth from './useAuth.js';

// What happens after Google hands back a credential, shared by the login and
// sign-up forms: sign in, greet, and go where a password login would go.
// onError(message) shows the failure on the form.
const useGoogleSignIn = (afterSignIn, onError) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  return useCallback(
    async (credential) => {
      try {
        const user = await googleLogin(credential);
        toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
        navigate(afterSignIn(user), { replace: true });
      } catch (err) {
        onError(err.message);
      }
    },
    [googleLogin, navigate, afterSignIn, onError]
  );
};

export default useGoogleSignIn;
