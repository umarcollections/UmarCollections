import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Large photo with thumbnails; switching photos crossfades with a slight zoom.
// title describes photos the admin left without their own description.
const ProductGallery = ({ images, title }) => {
  const [index, setIndex] = useState(0);
  const frame = useRef(null);
  const current = images[index];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-gallery-image]',
          { autoAlpha: 0, scale: 1.06 },
          { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
        );
      });
    },
    { scope: frame, dependencies: [index], revertOnUpdate: true }
  );

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-[2rem] bg-cream-200 text-xs uppercase tracking-[0.2em] text-caramel-700">
        No photo yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={frame}
        data-reveal-img
        className="group aspect-[4/5] overflow-hidden rounded-[2rem] bg-cream-200"
      >
        <img
          data-gallery-image
          key={current._id}
          src={current.url}
          alt={current.alt || title}
          className="size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-3">
          {images.map((image, i) => (
            <li key={image._id} className="w-20 sm:w-24">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-current={i === index ? 'true' : undefined}
                className={`block aspect-square w-full overflow-hidden rounded-2xl ring-2 ring-offset-2 ring-offset-cream-50 transition ${
                  i === index
                    ? 'ring-tangerine-500'
                    : 'ring-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={image.url} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductGallery;
