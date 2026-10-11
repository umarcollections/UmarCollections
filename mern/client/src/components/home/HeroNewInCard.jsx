import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { formatPrice } from '../../lib/format.js';

// The newest product, floating gently over the corner of the hero artwork.
// It has its own animation because products load after the hero appears.
const HeroNewInCard = ({ product }) => {
  const card = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ delay: 0.6 })
          .from(card.current, { y: 60, autoAlpha: 0, duration: 1, ease: 'power4.out' })
          .to(card.current, { y: -12, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
      });
    },
    { scope: card }
  );

  return (
    <Link
      ref={card}
      to={`/products/${product.slug}`}
      className="absolute -bottom-6 left-4 flex w-64 items-center gap-4 rounded-3xl bg-cream-50/90 p-3 pr-5 shadow-xl shadow-espresso-900/15 backdrop-blur-md transition-colors hover:bg-white sm:-left-8"
    >
      {product.images[0] && (
        <img src={product.images[0].url} alt="" className="size-16 rounded-2xl object-cover" />
      )}
      <span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-tangerine-700">
          New in
        </span>
        <span className="block font-display text-lg leading-tight text-espresso-900">
          {product.title}
        </span>
        <span className="text-sm text-espresso-800">{formatPrice(product.priceMin)}</span>
      </span>
    </Link>
  );
};

export default HeroNewInCard;
