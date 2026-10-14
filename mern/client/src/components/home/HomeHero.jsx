import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import HeroNewInCard from './HeroNewInCard.jsx';
import StoreButton from '../store/StoreButton.jsx';
import store from '../../lib/store.js';

// Wording used until the admin writes their own in Settings. It names what
// the store sells and where, which is what people search for.
const DEFAULT_HEADING = `Clothing, bags and shoes in ${store.city}`;
const DEFAULT_TEXT = `${store.name} is an online clothing store in ${store.city}. Shop shirts, trousers, knitwear, jackets, bags, shoes and accessories, with the fabric, sizes and stock listed on every product page.`;

// Opening screen: the heading rises word by word, the artwork unmasks and
// warm light drifts behind it. Render it once settings have loaded, so the
// heading that gets split into words is the final one.
const HomeHero = ({ settings, categories, newest }) => {
  const hero = useRef(null);
  const image = settings?.heroImage?.url;
  const heading = settings?.heroHeading || DEFAULT_HEADING;
  const text = settings?.heroText || DEFAULT_TEXT;
  const eyebrow = categories
    .slice(0, 3)
    .map((category) => category.name)
    .join(' / ');

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = SplitText.create('[data-hero-title]', { type: 'words', mask: 'words' });
        gsap
          .timeline({ defaults: { ease: 'power4.out' } })
          .from('[data-hero-frame]', {
            clipPath: 'inset(100% 0% 0% 0%)',
            duration: 1.4,
            ease: 'power4.inOut',
          })
          .from('[data-hero-art]', { scale: 1.25, duration: 1.8 }, 0)
          .from(split.words, { yPercent: 120, duration: 1.1, stagger: 0.06 }, 0.3)
          .from('[data-hero-fade]', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.7);

        gsap.to('[data-orb]', {
          x: 'random(-60, 60)',
          y: 'random(-40, 40)',
          duration: 'random(7, 11)',
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          repeatRefresh: true,
        });
        gsap.to('[data-hero-art]', {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: hero.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    },
    { scope: hero }
  );

  return (
    <section
      ref={hero}
      className="relative -mt-16 overflow-hidden bg-glow pt-16 lg:-mt-20 lg:pt-20"
    >
      {/* Soft gradients rather than blurred circles: a blur filter on something
          that keeps moving is too heavy for phones */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          data-orb
          className="absolute -left-40 top-2 size-[32rem] bg-radial from-cream-50/60 to-transparent to-70%"
        />
        <div
          data-orb
          className="absolute -right-32 -bottom-8 size-[36rem] bg-radial from-tangerine-400/40 to-transparent to-70%"
        />
      </div>

      <div className="relative mx-auto grid min-h-[88vh] max-w-7xl items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          {eyebrow && (
            <p
              data-hero-fade
              className="inline-flex rounded-full border border-espresso-900/15 bg-cream-50/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-espresso-800 backdrop-blur"
            >
              {eyebrow}
            </p>
          )}
          <h1
            data-hero-title
            className="mt-6 text-balance font-display text-[3.2rem] leading-[0.95] text-espresso-900 sm:text-7xl xl:text-[5.2rem]"
          >
            {heading}
          </h1>
          <p data-hero-fade className="mt-6 max-w-md text-base leading-relaxed text-espresso-800">
            {text}
          </p>
          <div data-hero-fade className="mt-10 flex flex-wrap gap-3">
            <StoreButton to="/shop">Shop now</StoreButton>
            <StoreButton to="/collections" variant="outline">
              Collections
            </StoreButton>
          </div>
        </div>

        <div className="relative">
          <div
            data-hero-frame
            className="relative aspect-[6/5] overflow-hidden rounded-[2.5rem] bg-caramel-300 shadow-2xl shadow-espresso-900/20"
          >
            {image && (
              <img
                data-hero-art
                src={image}
                alt=""
                className="absolute inset-0 size-full scale-110 object-cover"
              />
            )}
          </div>

          {newest && <HeroNewInCard product={newest} />}
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
