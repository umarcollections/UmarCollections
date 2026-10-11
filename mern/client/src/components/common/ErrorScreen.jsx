import StoreButton from '../store/StoreButton.jsx';
import Wordmark from '../store/Wordmark.jsx';
import store, { whatsappLink } from '../../lib/store.js';

// Shown by ErrorBoundary when a page can't be shown. "Go to the home page" is
// a full page load on purpose, so the visitor gets a fresh copy of the site.
const ErrorScreen = ({ onReload }) => (
  <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-center text-espresso-900">
    <p className="whitespace-nowrap font-display text-xl font-semibold uppercase tracking-[0.2em]">
      <Wordmark />
    </p>
    <h1 className="mt-10 font-display text-4xl sm:text-5xl">This page didn&apos;t load</h1>
    <p className="mt-4 max-w-md text-sm leading-relaxed text-espresso-800">
      This usually means a weak connection, or that we have just updated the site. Reloading fixes
      it in most cases. Your cart is saved.
    </p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <StoreButton onClick={onReload}>Reload page</StoreButton>
      <StoreButton variant="outline" href="/">
        Go to the home page
      </StoreButton>
    </div>
    <p className="mt-10 text-sm text-espresso-800">
      Still not working?{' '}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        className="inline-block py-2 font-semibold underline underline-offset-4"
      >
        WhatsApp us at {store.phone}
      </a>
    </p>
  </main>
);

export default ErrorScreen;
