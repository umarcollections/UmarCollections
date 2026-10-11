import StoreIcon from './StoreIcon.jsx';
import store, { whatsappLink } from '../../lib/store.js';

// The chat opens with a greeting already typed, so the visitor only has to ask
const chatLink = `${whatsappLink}?text=${encodeURIComponent(`Hi ${store.name}, `)}`;

// Floating chat button on every storefront page. WhatsApp's darker teal keeps
// the white icon readable (their bright green is too light behind white). It
// sits below the header and cart drawer, so the phone menu and drawer cover it.
const WhatsAppButton = () => (
  <a
    href={chatLink}
    target="_blank"
    rel="noreferrer"
    aria-label={`Chat with us on WhatsApp, ${store.phone}`}
    title="Chat with us on WhatsApp"
    className="fixed bottom-5 right-5 z-20 grid size-14 place-items-center rounded-full bg-[#128c7e] text-white shadow-lg shadow-espresso-900/25 ring-4 ring-white/40 transition duration-300 hover:-translate-y-0.5 hover:bg-[#075e54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tangerine-500 sm:bottom-8 sm:right-8"
  >
    <StoreIcon name="whatsapp" className="size-7 [stroke-width:1.7]" />
  </a>
);

export default WhatsAppButton;
