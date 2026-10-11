import { useCallback, useEffect, useMemo, useState } from 'react';
import CartContext from './CartContext.js';
import { MAX_QUANTITY } from '../../validators/orders/checkout.schema.js';

// The cart is kept in this browser so guests don't need an account. It holds
// only ids, quantities and display details; prices and stock always come from
// the server's quote (see useCartQuote).
const STORAGE_KEY = 'cart';
const DISCOUNT_KEY = 'cart-discount';

const isCartItem = (item) =>
  item && typeof item.productId === 'string' && typeof item.variantId === 'string';

const readCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(items) ? items.filter(isCartItem) : [];
  } catch {
    // Storage blocked or corrupted: start with an empty cart
    return [];
  }
};

const readDiscount = () => {
  try {
    return localStorage.getItem(DISCOUNT_KEY) ?? '';
  } catch {
    return '';
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The cart still works for this visit, it just won't be remembered
  }
};

const clamp = (quantity) => Math.min(MAX_QUANTITY, Math.max(1, quantity));

const CartProvider = ({ children }) => {
  const [items, setItems] = useState(readCart);
  // The code the shopper typed; whether it applies is decided by the server's quote
  const [discountCode, setDiscountCode] = useState(readDiscount);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => save(STORAGE_KEY, JSON.stringify(items)), [items]);
  useEffect(() => save(DISCOUNT_KEY, discountCode), [discountCode]);

  // Keep every open tab showing the same cart
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setItems(readCart());
      if (event.key === DISCOUNT_KEY) setDiscountCode(readDiscount());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // item: { productId, variantId, slug, title, variantLabel, image }
  const addItem = useCallback((item, quantity) => {
    setItems((current) => {
      const existing = current.find((line) => line.variantId === item.variantId);
      if (!existing) return [...current, { ...item, quantity: clamp(quantity) }];
      return current.map((line) =>
        line === existing ? { ...line, ...item, quantity: clamp(line.quantity + quantity) } : line
      );
    });
  }, []);

  const setQuantity = useCallback((variantId, quantity) => {
    setItems((current) =>
      current.map((line) =>
        line.variantId === variantId ? { ...line, quantity: clamp(quantity) } : line
      )
    );
  }, []);

  const removeItem = useCallback((variantId) => {
    setItems((current) => current.filter((line) => line.variantId !== variantId));
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const clear = useCallback(() => {
    setItems([]);
    setDiscountCode('');
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      discountCode,
      setDiscountCode,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [
      items,
      discountCode,
      drawerOpen,
      addItem,
      setQuantity,
      removeItem,
      openDrawer,
      closeDrawer,
      clear,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
