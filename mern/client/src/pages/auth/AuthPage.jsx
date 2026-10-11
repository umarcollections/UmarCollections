import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import LoginForm from '../../components/auth/LoginForm.jsx';
import SignupForm from '../../components/auth/SignupForm.jsx';
import StoreButton from '../../components/store/StoreButton.jsx';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import store from '../../lib/store.js';

// What the sliding panel says while each form is showing: it invites the
// visitor to the other one
const PANEL_COPY = {
  login: {
    eyebrow: `New to ${store.name}`,
    title: 'Create an account',
    text: 'See every order you place in one place. You can still check out as a guest without one.',
    action: 'Sign up',
  },
  signup: {
    eyebrow: 'Already a customer',
    title: 'Welcome back',
    text: 'Log in to see your orders and check out faster.',
    action: 'Log in',
  },
};

// /login and /signup share this page. On wide screens the forms sit side by
// side and an orange panel slides across to cover the one not in use; on
// phones the forms crossfade in the same spot. Switching updates the URL, so
// links and the back button keep working.
const AuthPage = () => {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const card = useRef(null);
  const firstRun = useRef(true);
  const mode = pathname === '/signup' ? 'signup' : 'login';
  const redirectTo = state?.from?.pathname || '/account';
  usePageTitle(mode === 'signup' ? 'Create an account' : 'Log in');

  // Keeps where the visitor was heading (state.from) when they switch forms
  const switchMode = () =>
    navigate(mode === 'login' ? '/signup' : '/login', { replace: true, state });

  useGSAP(
    () => {
      // The end positions always apply; only the motion is skipped on first
      // paint and for visitors who prefer reduced motion
      const still =
        firstRun.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      firstRun.current = false;
      const toSignup = mode === 'signup';
      const d = still ? 0 : 1;

      gsap
        .timeline({ defaults: { ease: 'power4.inOut', duration: d } })
        .to('[data-auth-panel]', { xPercent: toSignup ? -100 : 0 }, 0)
        .to('[data-auth-glow]', { xPercent: toSignup ? 25 : -25 }, 0)
        .to(
          '[data-auth-form="login"]',
          { autoAlpha: toSignup ? 0 : 1, x: toSignup ? -48 : 0, duration: d * 0.6 },
          toSignup ? 0 : d * 0.4
        )
        .to(
          '[data-auth-form="signup"]',
          { autoAlpha: toSignup ? 1 : 0, x: toSignup ? 0 : 48, duration: d * 0.6 },
          toSignup ? d * 0.4 : 0
        )
        .to(
          '[data-panel-copy="login"]',
          { autoAlpha: toSignup ? 0 : 1, y: toSignup ? -24 : 0, duration: d * 0.5 },
          toSignup ? 0 : d * 0.5
        )
        .to(
          '[data-panel-copy="signup"]',
          { autoAlpha: toSignup ? 1 : 0, y: toSignup ? 0 : 24, duration: d * 0.5 },
          toSignup ? d * 0.5 : 0
        );
    },
    { scope: card, dependencies: [mode] }
  );

  return (
    <section className="relative -mt-16 overflow-hidden bg-glow pt-16 lg:-mt-20 lg:pt-20">
      <div
        aria-hidden="true"
        className="absolute -left-32 top-20 size-[26rem] rounded-full bg-cream-50/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-24 size-[30rem] rounded-full bg-tangerine-400/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-8 lg:py-20">
        <div
          ref={card}
          className="relative grid overflow-hidden rounded-[2.5rem] bg-cream-50 shadow-2xl shadow-espresso-900/15 md:min-h-[40rem] md:grid-cols-2"
        >
          <div
            data-auth-form="login"
            className="col-start-1 row-start-1 p-8 sm:p-12 md:flex md:flex-col md:justify-center"
          >
            <LoginForm redirectTo={redirectTo} onSwitch={switchMode} />
          </div>
          <div
            data-auth-form="signup"
            className="col-start-1 row-start-1 p-8 sm:p-12 md:col-start-2 md:flex md:flex-col md:justify-center"
          >
            <SignupForm redirectTo={redirectTo} onSwitch={switchMode} />
          </div>

          {/* Starts over the right half (sign-up side) and slides left for sign-up */}
          <div
            data-auth-panel
            className="absolute inset-y-0 left-1/2 hidden w-1/2 overflow-hidden bg-ember md:block"
          >
            <div data-auth-glow aria-hidden="true" className="absolute inset-0">
              <div className="absolute -left-16 -top-16 size-80 rounded-full bg-cream-50/25 blur-3xl" />
              <div className="absolute -bottom-20 right-0 size-96 rounded-full bg-espresso-900/25 blur-3xl" />
            </div>
            <div className="relative grid h-full place-items-center p-12 text-center text-white">
              {Object.entries(PANEL_COPY).map(([forMode, copy]) => (
                <div key={forMode} data-panel-copy={forMode} className="col-start-1 row-start-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cream-100">
                    {copy.eyebrow}
                  </p>
                  <h2 className="mt-4 font-display text-5xl leading-none">{copy.title}</h2>
                  <p className="mx-auto mt-5 max-w-xs text-sm leading-relaxed text-cream-100">
                    {copy.text}
                  </p>
                  <StoreButton variant="light" onClick={switchMode} className="mt-10">
                    {copy.action}
                  </StoreButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
