import { useEffect, useRef, useState } from 'react';
import OrDivider from './OrDivider.jsx';
import useSettings from '../../hooks/settings/useSettings.js';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
// Google's button can't be wider than this
const MAX_WIDTH = 400;

// Google's sign-in script, added to the page once, the first time a button shows
let scriptLoading;
// Google allows one set-up per page, so it is done once and its callback goes
// to whichever button is on screen (only one is at a time)
let initializedFor;
let activeHandler;
const loadGoogleScript = () => {
  scriptLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      scriptLoading = undefined;
      reject(new Error('Google sign-in did not load'));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
};

// Google's own "Continue with Google" button (their brand rules require it),
// then an "or with email" divider. Shows only once the store has a Google
// client ID. onCredential gets the ID token, which the server checks before
// signing anyone in.
const GoogleButton = ({ onCredential }) => {
  const { data: settings } = useSettings();
  const clientId = settings?.googleClientId;
  const container = useRef(null);
  const handler = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    handler.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const mine = (credential) => handler.current(credential);
    activeHandler = mine;
    return () => {
      if (activeHandler === mine) activeHandler = undefined;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !container.current) return;
        if (initializedFor !== clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: ({ credential }) => activeHandler?.(credential),
            ux_mode: 'popup',
          });
          initializedFor = clientId;
        }
        window.google.accounts.id.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: Math.min(MAX_WIDTH, container.current.offsetWidth),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) return null;
  if (failed) {
    return (
      <p className="rounded-2xl bg-cream-100 px-4 py-3 text-center text-xs text-espresso-800">
        Google sign-in didn&apos;t load (an ad blocker can stop it). Use your email below.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      <div className="group relative">
        <div ref={container} className="flex min-h-11 w-full justify-center" />
        <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-caramel-400 transition-all duration-200 group-hover:border-caramel-600 group-hover:shadow-[0_0_0_3px_theme(colors.caramel.200)]" />
      </div>
      <OrDivider />
    </div>
  );
};

export default GoogleButton;
