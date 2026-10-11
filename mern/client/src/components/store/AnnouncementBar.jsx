import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import useSettings from '../../hooks/settings/useSettings.js';
import { formatPrice } from '../../lib/format.js';
import store from '../../lib/store.js';

// Only true statements: the admin's own message, the real free delivery
// amount, where we deliver and how to pay
const messagesFrom = (settings) =>
  [
    settings.announcement,
    settings.freeShippingThreshold != null &&
      `Free delivery on orders of ${formatPrice(settings.freeShippingThreshold)} or more`,
    `Delivery within ${store.city}`,
    'Pay by bank transfer',
  ].filter(Boolean);

// A slow, endless ticker. The text is repeated so the loop has no gap.
const AnnouncementBar = () => {
  const { data: settings } = useSettings();
  const container = useRef(null);
  const messages = settings ? messagesFrom(settings) : [];

  useGSAP(
    () => {
      if (!messages.length) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to('[data-ticker]', { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
      });
    },
    { scope: container, dependencies: [messages.join('|')], revertOnUpdate: true }
  );

  if (!messages.length) return null;
  const run = [...messages, ...messages, ...messages];

  return (
    <div ref={container} className="overflow-hidden bg-ember py-2.5 text-white">
      <p className="sr-only">{messages.join('. ')}</p>
      <div data-ticker aria-hidden="true" className="flex w-max">
        {[run, run].map((group, g) => (
          <ul key={g} className="flex shrink-0">
            {group.map((message, i) => (
              <li
                key={`${g}-${i}`}
                className="flex items-center gap-8 px-4 text-[11px] font-medium uppercase tracking-[0.22em]"
              >
                {message}
                <span className="size-1 rounded-full bg-white/70" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;
