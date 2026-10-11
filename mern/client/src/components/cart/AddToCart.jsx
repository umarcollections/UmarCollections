import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QuantityStepper from './QuantityStepper.jsx';
import StoreButton from '../store/StoreButton.jsx';
import useCart from '../../hooks/cart/useCart.js';
import { MAX_QUANTITY } from '../../validators/orders/checkout.schema.js';

const AddToCart = ({ product, variant }) => {
  const { items, addItem, openDrawer } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const inCart = items.find((line) => line.variantId === variant._id)?.quantity ?? 0;
  // What can still be added without going past the stock or the per-order limit
  const room = Math.min(variant.stock, MAX_QUANTITY) - inCart;
  const amount = Math.max(1, Math.min(quantity, room));

  const add = () => {
    addItem(
      {
        productId: product._id,
        variantId: variant._id,
        slug: product.slug,
        title: product.title,
        variantLabel: variant.optionValues.join(' / '),
        image: product.images[0]?.url ?? null,
      },
      amount
    );
    setQuantity(1);
  };

  // The cart drawer slides in to show what was added
  const handleAdd = () => {
    add();
    openDrawer();
  };

  // Adds this item and goes straight to checkout. Anything already in the cart
  // stays there; if all the stock is already in the cart it just goes to checkout.
  const handleBuyNow = () => {
    if (room > 0) add();
    navigate('/checkout');
  };

  if (variant.stock === 0) {
    return (
      <StoreButton disabled className="mt-6 w-full">
        Sold out
      </StoreButton>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3">
        {room > 0 && <QuantityStepper value={amount} max={room} onChange={setQuantity} />}
        <StoreButton onClick={handleAdd} disabled={room <= 0} className="flex-1">
          {room > 0 ? 'Add to cart' : 'All available stock is in your cart'}
        </StoreButton>
      </div>
      <StoreButton variant="dark" onClick={handleBuyNow} className="w-full">
        Buy it now
      </StoreButton>
      {inCart > 0 && (
        <p className="pt-1 text-sm text-espresso-800">
          {inCart} in your cart.{' '}
          <Link to="/cart" className="font-medium text-espresso-900 underline underline-offset-4">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
};

export default AddToCart;
