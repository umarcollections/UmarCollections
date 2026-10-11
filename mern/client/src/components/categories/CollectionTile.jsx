import { Link } from 'react-router-dom';

// A category as a large photo tile with its name over a soft dark fade.
// `tall` stretches it for the featured spot in a bento grid.
const CollectionTile = ({ category, tall = false }) => (
  <Link
    to={`/shop?category=${category.slug}`}
    data-reveal-img
    className={`group relative block overflow-hidden rounded-[2rem] bg-caramel-300 ${
      tall ? 'aspect-[4/5] lg:aspect-auto lg:h-full' : 'aspect-[4/5]'
    }`}
  >
    {category.image?.url && (
      <img
        src={category.image.url}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition duration-[1400ms] ease-out group-hover:scale-110"
      />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/75 via-espresso-900/10 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-8">
      <div>
        <h3 className="font-display text-3xl text-white sm:text-4xl">{category.name}</h3>
        {category.description && (
          <p className="mt-2 max-w-xs text-sm text-cream-100/85">{category.description}</p>
        )}
      </div>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-cream-50/90 text-espresso-900 transition duration-500 group-hover:rotate-[-45deg] group-hover:bg-white">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </div>
  </Link>
);

export default CollectionTile;
