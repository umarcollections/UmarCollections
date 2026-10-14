import { Link } from 'react-router-dom';
import { formatPrice } from '../../lib/format.js';

const cheapestVariant = (variants) =>
  variants.reduce((cheapest, variant) => (variant.price < cheapest.price ? variant : cheapest));

// The second photo fades in on hover, and a "View product" label slides up
const ProductCard = ({ product }) => {
  const variant = cheapestVariant(product.variants);
  const onSale = variant.compareAtPrice > variant.price;
  const [image, hoverImage] = product.images;

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-cream-200">
        {image ? (
          <>
            <img
              src={image.url}
              alt={image.alt || product.title}
              loading="lazy"
              className="size-full object-cover transition duration-[1200ms] ease-out group-hover:scale-105"
            />
            {hoverImage && (
              <img
                src={hoverImage.url}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-0 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-xs uppercase tracking-[0.2em] text-caramel-700">
            No photo yet
          </div>
        )}

        <div className="absolute left-4 top-4 flex gap-2">
          {onSale && (
            <span className="rounded-full bg-ember px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              Sale
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-full bg-espresso-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-50">
              Sold out
            </span>
          )}
        </div>

        <span className="absolute inset-x-4 bottom-4 translate-y-4 rounded-full bg-cream-50/90 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso-900 opacity-0 backdrop-blur transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          View product
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          {product.category?.name && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-caramel-700">
              {product.category.name}
            </p>
          )}
          <h3 className="mt-1 font-display text-xl leading-tight text-espresso-900">
            {product.title}
          </h3>
        </div>
        <p className="text-sm sm:shrink-0 sm:pt-4 sm:text-right">
          <span className="block font-medium text-espresso-900">
            {product.priceMin !== product.priceMax && 'From '}
            {formatPrice(variant.price)}
          </span>
          {onSale && (
            <s className="text-xs text-espresso-700/60">{formatPrice(variant.compareAtPrice)}</s>
          )}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
