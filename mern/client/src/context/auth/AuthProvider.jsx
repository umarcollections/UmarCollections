import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AuthContext from './AuthContext.js';
import { UNAUTHORIZED_EVENT } from '../../services/api.js';
import {
  adminLoginRequest,
  getSessionRequest,
  loginRequest,
  logoutRequest,
  signupRequest,
} from '../../services/auth/auth.service.js';

// Tells other open tabs when this tab logs in or out
const createChannel = () =>
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('auth');

// Asks the server whether the cookie holds a valid session. If the server
// can't be reached, the visitor is treated as a guest.
const fetchSession = () =>
  getSessionRequest()
    .then(({ data }) => ({ user: data, status: data ? 'authenticated' : 'unauthenticated' }))
    .catch(() => ({ user: null, status: 'unauthenticated' }));

// The session lives in an httpOnly cookie that JavaScript can't read, so the
// only way to know if we're logged in is to ask the server (GET /auth/session).
// status: 'loading' until that answer arrives, then 'authenticated' or 'unauthenticated'
const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  // Clears local state only; the cookie is handled by the server
  const clearSession = useCallback(() => {
    // Drop cached API data so the next user never sees it
    queryClient.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, [queryClient]);

  const restoreSession = useCallback(async () => {
    const session = await fetchSession();
    setUser(session.user);
    setStatus(session.status);
  }, []);

  // On first load, restore the session from the cookie
  useEffect(() => {
    let cancelled = false;
    fetchSession().then((session) => {
      if (cancelled) return;
      setUser(session.user);
      setStatus(session.status);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const channel = createChannel();
    channelRef.current = channel;

    // Keep every open tab in sync with logins and logouts in other tabs
    if (channel) {
      channel.onmessage = ({ data }) => {
        if (data === 'logout') clearSession();
        if (data === 'login') restoreSession();
      };
    }

    // Any API call rejected with 401 (expired or revoked session) ends the session
    const onUnauthorized = () => {
      clearSession();
      toast.error('Your session has expired, please log in again', { id: 'session-expired' });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
      channel?.close();
      channelRef.current = null;
    };
  }, [clearSession, restoreSession]);

  const startSession = useCallback(({ data }) => {
    setUser(data);
    setStatus('authenticated');
    channelRef.current?.postMessage('login');
    return data;
  }, []);

  // Both resolve to the logged-in user
  const login = useCallback(
    async (credentials) => startSession(await loginRequest(credentials)),
    [startSession]
  );

  const adminLogin = useCallback(
    async (credentials) => startSession(await adminLoginRequest(credentials)),
    [startSession]
  );

  const signup = useCallback(
    async (details) => startSession(await signupRequest(details)),
    [startSession]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Still log out locally; the cookie expires on its own
    }
    clearSession();
    channelRef.current?.postMessage('logout');
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      adminLogin,
      signup,
      logout,
    }),
    [user, status, login, adminLogin, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
