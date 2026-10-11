import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'bg-espresso-900 text-cream-50 shadow-sm hover:bg-espresso-800',
  secondary:
    'border border-caramel-300 bg-cream-50 text-espresso-900 shadow-sm hover:border-espresso-900',
  danger: 'border border-red-300 bg-white text-red-700 hover:border-red-700',
};

// Pass `to` for a link that looks like a button
const AdminButton = ({ variant = 'primary', to, type = 'button', className = '', ...props }) => {
  const classes = `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-caramel-600 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`;

  if (to) return <Link to={to} className={classes} {...props} />;
  return <button type={type} className={classes} {...props} />;
};

export default AdminButton;
