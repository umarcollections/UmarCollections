import { Link } from 'react-router-dom';

const VARIANTS = {
  // Main actions: add to cart, checkout, place order
  solid:
    'bg-ember text-white shadow-lg shadow-tangerine-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-tangerine-500/30 disabled:translate-y-0 disabled:bg-none disabled:bg-caramel-300 disabled:text-espresso-700 disabled:shadow-none',
  // Second action next to a solid one, e.g. Buy it now
  dark: 'bg-espresso-900 text-cream-50 hover:-translate-y-0.5 hover:bg-espresso-800',
  outline:
    'border border-espresso-900/80 text-espresso-900 hover:bg-espresso-900 hover:text-cream-50',
  // On top of a photo or a dark band
  light: 'bg-cream-50 text-espresso-900 hover:-translate-y-0.5 hover:bg-white',
};

// Rounded storefront button in small spaced capitals. Pass `to` for a page in
// the store, or `href` for an outside link such as WhatsApp.
const StoreButton = ({
  variant = 'solid',
  to,
  href,
  type = 'button',
  className = '',
  ...props
}) => {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tangerine-500 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`;

  if (to) return <Link to={to} className={classes} {...props} />;
  if (href) return <a href={href} className={classes} {...props} />;
  return <button type={type} className={classes} {...props} />;
};

export default StoreButton;
