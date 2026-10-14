import { Link } from 'react-router-dom';
import QuantityStepper from './QuantityStepper.jsx';
import { formatPrice } from '../../lib/format.js';
import { MAX_QUANTITY } from '../../validators/orders/checkout.schema.js';

// One cart item, shared by the cart page and the cart drawer. `line` is the
// server's quote (live price, stock, problem); `item` is what the cart
// remembered, used for the name and photo of something no longer for sale.
const CartLine = ({ line, item, onQuantity, onRemove, onNavigate, compact = false }) => {
  const title = line.title ?? item?.title ?? 'Item';
  const slug = line.slug ?? item?.slug;
  const image = line.image ?? item?.image;
  const variantLabel = line.variantLabel ?? item?.variantLabel;

  return (
    <div className="flex gap-4">
      <div
        className={`shrink-0 overflow-hidden rounded-2xl bg-cream-200 ${
          compact ? 'h-24 w-20' : 'h-32 w-24'
        }`}
      >
        {image && <img src={image} alt="" className="size-full object-cover" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {slug ? (
              <Link
                to={`/products/${slug}`}
                onClick={onNavigate}
                className="font-display text-xl leading-tight text-espresso-900 hover:text-tangerine-700"
              >
                {title}
              </Link>
            ) : (
              <p className="font-display text-xl leading-tight text-espresso-900">{title}</p>
            )}
            {variantLabel && <p className="mt-0.5 text-xs text-espresso-700">{variantLabel}</p>}
          </div>
          {!line.problem && (
            <p className="shrink-0 text-sm font-medium tabular-nums text-espresso-900">
              {formatPrice(line.lineTotal)}
            </p>
          )}
        </div>

        {line.price != null && line.quantity > 1 && !line.problem && (
          <p className="mt-1 text-xs text-espresso-700">{formatPrice(line.price)} each</p>
        )}
        {line.problem && <p className="mt-1 text-xs font-medium text-red-700">{line.problem}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {line.stock > 0 && (
            <QuantityStepper
              size="sm"
              label={`Quantity of ${title}`}
              value={line.quantity}
              max={Math.min(line.stock, MAX_QUANTITY)}
              onChange={onQuantity}
            />
          )}
          {line.stock > 0 && line.stock < line.quantity && (
            <button
              type="button"
              onClick={() => onQuantity(line.stock)}
              className="-my-2 py-2 text-xs font-semibold text-espresso-900 underline underline-offset-4"
            >
              Change to {line.stock}
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="-my-2 py-2 text-xs text-espresso-700 underline underline-offset-4 hover:text-espresso-900"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartLine;
