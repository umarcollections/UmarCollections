import { useRef } from 'react';
import PageBanner from '../../components/store/PageBanner.jsx';
import SectionHeading from '../../components/store/SectionHeading.jsx';
import StoreButton from '../../components/store/StoreButton.jsx';
import usePageTitle from '../../hooks/common/usePageTitle.js';
import useStoreMotion from '../../hooks/common/useStoreMotion.js';
import store, { mapsLink, phoneLink, whatsappLink } from '../../lib/store.js';

// What the store does, written so the owner can edit it here in one place.
// Everything on this page describes how the shop actually works.
const PROMISES = [
  {
    title: 'Clear details',
    text: 'Every product lists its fabric, fit and care, so you know what you are buying.',
  },
  {
    title: 'Honest stock',
    text: 'Sizes show as in stock only when they are on the shelf. Your order holds them for you.',
  },
  {
    title: 'Simple payment',
    text: 'Pay by bank transfer from your own bank or app. No card details needed.',
  },
  {
    title: 'Local delivery',
    text: `We deliver within ${store.city} once your payment is confirmed.`,
  },
];

const AboutPage = () => {
  const page = useRef(null);
  usePageTitle('About');
  useStoreMotion(page);

  return (
    <div ref={page}>
      <PageBanner
        eyebrow={`About ${store.name}`}
        title="Clothing and bags chosen for everyday wear"
        text="Shirts, trousers, knitwear, outerwear, bags and accessories, picked for how they feel and how long they last."
      />

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
        <div>
          <SectionHeading eyebrow="What we sell" title="Pieces you reach for again and again" />
          <div className="mt-8 space-y-5 text-base leading-relaxed text-espresso-800">
            <p data-reveal>
              We keep the range small: linen and cotton shirts, easy trousers, soft knitwear, a few
              coats and jackets, and leather and canvas bags.
            </p>
            <p data-reveal>
              Every product page shows what it is made of, how it fits and exactly which sizes are
              in stock right now.
            </p>
          </div>
        </div>
        <div
          data-reveal-img
          className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-caramel-300"
        >
          <img
            data-parallax="16"
            src="/demo/editorial.svg"
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full scale-125 object-cover"
          />
        </div>
      </section>

      <section className="bg-roast py-24 text-cream-100 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <p
            data-reveal
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-caramel-300"
          >
            How we work
          </p>
          <h2
            data-split
            className="mt-3 max-w-3xl font-display text-4xl leading-tight text-white sm:text-6xl"
          >
            Four things you can count on
          </h2>
          <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((promise, i) => (
              <li
                key={promise.title}
                data-reveal
                className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
              >
                <span className="font-display text-5xl italic text-ember">0{i + 1}</span>
                <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-white">
                  {promise.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-cream-200/80">{promise.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-8 lg:py-32">
        <SectionHeading
          align="center"
          eyebrow="Get in touch"
          title="Questions about sizing or an order?"
        />
        <p data-reveal className="mt-6 text-base text-espresso-800">
          Message us on WhatsApp, call or email and we will help you choose.
        </p>
        <dl data-reveal className="mt-10 grid gap-6 text-left sm:grid-cols-[1fr_1.4fr_1fr]">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-tangerine-700">
              Phone and WhatsApp
            </dt>
            <dd className="mt-2 text-sm text-espresso-900">
              <a href={phoneLink} className="underline underline-offset-4">
                {store.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-tangerine-700">
              Email
            </dt>
            <dd className="mt-2 text-sm text-espresso-900 wrap-anywhere">
              <a href={`mailto:${store.email}`} className="underline underline-offset-4">
                {store.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-tangerine-700">
              Address
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-espresso-900">
              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {store.address}
              </a>
            </dd>
          </div>
        </dl>
        <div data-reveal className="mt-12 flex flex-wrap justify-center gap-3">
          <StoreButton href={whatsappLink} target="_blank" rel="noreferrer">
            Chat on WhatsApp
          </StoreButton>
          <StoreButton to="/shop" variant="outline">
            Shop the collection
          </StoreButton>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
