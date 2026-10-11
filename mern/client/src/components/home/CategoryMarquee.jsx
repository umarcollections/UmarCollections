import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Collection names in very large type that slide sideways as the page scrolls
const CategoryMarquee = ({ categories }) => {
  const section = useRef(null);
  const names = [...categories, ...categories];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-marquee]',
          { xPercent: 0 },
          {
            xPercent: -35,
            ease: 'none',
            scrollTrigger: {
              trigger: section.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          }
        );
      });
    },
    { scope: section, dependencies: [categories.length], revertOnUpdate: true }
  );

  return (
    <section
      ref={section}
      aria-label="Collections"
      className="overflow-hidden border-y border-espresso-900/10 py-10"
    >
      <ul data-marquee className="flex w-max items-center gap-10 whitespace-nowrap">
        {names.map((category, i) => (
          <li key={`${category._id}-${i}`} className="flex items-center gap-10">
            <Link
              to={`/shop?category=${category.slug}`}
              tabIndex={i < categories.length ? 0 : -1}
              aria-hidden={i >= categories.length || undefined}
              className={`font-display text-6xl italic transition-colors sm:text-8xl ${
                i % 2 ? 'text-ember' : 'text-espresso-700/70 hover:text-espresso-900'
              }`}
            >
              {category.name}
            </Link>
            <span aria-hidden="true" className="size-3 rounded-full bg-ember" />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CategoryMarquee;
