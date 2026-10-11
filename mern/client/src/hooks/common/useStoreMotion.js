import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Scroll animations for storefront pages, switched on with data attributes
// inside `scope`:
//   data-split            heading whose words rise into place
//   data-reveal           fades up when it scrolls into view (neighbours stagger)
//   data-reveal-img       photo frame that unmasks from the bottom
//   data-parallax="12"    drifts by that many percent while it scrolls past
// Pass `deps` that change when content arrives so new elements are picked up.
// Nothing moves for visitors who ask their device for reduced motion.
const useStoreMotion = (scope, deps = []) => {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        root.querySelectorAll('[data-split]').forEach((el) => {
          SplitText.create(el, {
            type: 'lines,words',
            mask: 'lines',
            autoSplit: true,
            // Re-splits when fonts load or the width changes, keeping lines correct
            onSplit: (self) =>
              gsap.from(self.words, {
                yPercent: 115,
                duration: 1.1,
                ease: 'power4.out',
                stagger: 0.035,
                scrollTrigger: { trigger: el, start: 'top 90%', once: true },
              }),
          });
        });

        // Nothing to set up while the page is still loading its content
        const reveals = root.querySelectorAll('[data-reveal]');
        if (reveals.length) gsap.set(reveals, { autoAlpha: 0, y: 40 });
        ScrollTrigger.batch(reveals, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
              stagger: 0.08,
              overwrite: true,
            }),
        });

        root.querySelectorAll('[data-reveal-img]').forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 1.3,
              ease: 'power4.inOut',
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }
          );
        });

        root.querySelectorAll('[data-parallax]').forEach((el) => {
          const amount = Number(el.dataset.parallax) || 10;
          gsap.fromTo(
            el,
            { yPercent: -amount / 2 },
            {
              yPercent: amount / 2,
              ease: 'none',
              scrollTrigger: {
                trigger: el.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
        });
      });
    },
    { scope, dependencies: deps, revertOnUpdate: true }
  );
};

export default useStoreMotion;
