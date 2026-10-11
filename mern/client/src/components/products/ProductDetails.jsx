import { Link } from 'react-router-dom';
import ProductGallery from './ProductGallery.jsx';
import VariantPicker from './VariantPicker.jsx';
import AddToCart from '../cart/AddToCart.jsx';
import useVariantSelection from '../../hooks/products/useVariantSelection.js';
import useSettings from '../../hooks/settings/useSettings.js';
import { formatPrice, formatPriceRange } from '../../lib/format.js';
import store from '../../lib/store.js';

// Low enough to be worth telling the shopper; the number shown is the real stock
const LOW_STOCK = 5;

const stockState = (stock) => {
  if (stock === 0) return { text: 'Sold out', dot: 'bg-espresso-700/40' };
  if (stock <= LOW_STOCK) return { text: `Only ${stock} left`, dot: 'bg-tangerine-500' };
  return { text: 'In stock, ready to send', dot: 'bg-green-600' };
};

const Panel = ({ title, open = false, children }) => (
  <details open={open} className="group border-t border-espresso-900/10 py-5">
    <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso-900 [&::-webkit-details-marker]:hidden">
      {title}
      <span
        aria-hidden="true"
        className="text-lg transition-transform duration-300 group-open:rotate-45"
      >
        +
      </span>
    </summary>
    <div className="pt-4 text-sm leading-relaxed text-espresso-800">{children}</div>
  </details>
);

const ProductDetails = ({ product }) => {
  const { options, selected, variant, choose, valueState } = useVariantSelection(product);
  const { data: settings } = useSettings();
  const onSale = variant?.compareAtPrice > variant?.price;
  const saving = onSale ? Math.round((1 - variant.price / variant.compareAtPrice) * 100) : 0;
  const stock = variant && stockState(variant.stock);

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <ProductGallery images={product.images} />

      <div className="lg:sticky lg:top-28 lg:self-start">
        <nav data-reveal aria-label="Breadcrumb" className="text-xs text-espresso-700">
          <Link to="/shop" className="hover:text-espresso-900">
            Shop
          </Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link
                to={`/shop?category=${product.category.slug}`}
                className="hover:text-espresso-900"
              >
                {product.category.name}
              </Link>
            </>
          )}
        </nav>

        <h1
          data-split
          className="mt-4 font-display text-5xl leading-[1] text-espresso-900 sm:text-6xl"
        >
          {product.title}
        </h1>

        <div data-reveal className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-2xl font-medium text-espresso-900">
            {variant
              ? formatPrice(variant.price)
              : formatPriceRange(product.priceMin, product.priceMax)}
          </span>
          {onSale && (
            <>
              <s className="text-lg text-espresso-700/50">{formatPrice(variant.compareAtPrice)}</s>
              <span className="rounded-full bg-ember px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                Save {saving}%
              </span>
            </>
          )}
        </div>

        {options.length > 0 && (
          <div data-reveal className="mt-10">
            <VariantPicker
              options={options}
              selected={selected}
              choose={choose}
              valueState={valueState}
            />
          </div>
        )}

        {variant && (
          <div data-reveal className="mt-8">
            <p className="flex items-center gap-2 text-sm text-espresso-800">
              <span className={`size-2 rounded-full ${stock.dot}`} />
              {stock.text}
            </p>
            <AddToCart product={product} variant={variant} />
          </div>
        )}

        <div data-reveal className="mt-10">
          <Panel title="Details" open>
            <p className="whitespace-pre-line">{product.description || 'No details added yet.'}</p>
          </Panel>
          <Panel title="Delivery">
            We deliver within {store.city} once your payment is confirmed.
            {settings?.freeShippingThreshold != null &&
              ` Orders of ${formatPrice(settings.freeShippingThreshold)} or more are delivered free.`}
          </Panel>
          <Panel title="Payment">
            Pay by bank transfer. After you place your order you will see our bank details, and your
            items are held for you while you pay.
          </Panel>
          <Panel title="Returns">
            If an item arrives damaged or you receive the wrong one, contact us and we will put it
            right. See our{' '}
            <Link to="/terms" className="underline underline-offset-4">
              Terms and Conditions
            </Link>
            .
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
