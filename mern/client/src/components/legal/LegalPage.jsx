import usePageTitle from '../../hooks/common/usePageTitle.js';
import store, { whatsappLink } from '../../lib/store.js';

const LegalPage = ({ title, updated, children }) => {
  usePageTitle(title);

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
      <header>
        <h1 className="font-display text-5xl text-espresso-900">{title}</h1>
        <p className="mt-2 text-sm text-espresso-700">Last updated {updated}</p>
      </header>
      {children}
      <p className="border-t border-caramel-300/60 pt-6 text-sm text-espresso-700">
        Questions about this page? Email{' '}
        <a
          href={`mailto:${store.email}`}
          className="text-espresso-900 underline underline-offset-4"
        >
          {store.email}
        </a>{' '}
        or{' '}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="text-espresso-900 underline underline-offset-4"
        >
          WhatsApp {store.phone}
        </a>
        .
      </p>
    </article>
  );
};

export default LegalPage;
