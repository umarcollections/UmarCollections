// Thin line icons for the storefront. Decorative: the link or button around
// each one carries the accessible label or visible text.
const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  phone: (
    <path d="M7.2 3.5h2.3l1.3 4.1-1.9 1.3a10.5 10.5 0 0 0 6.2 6.2l1.3-1.9 4.1 1.3v2.3a2 2 0 0 1-2.2 2A15.8 15.8 0 0 1 5.2 5.7a2 2 0 0 1 2-2.2z" />
  ),
  whatsapp: (
    <>
      <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4l-4.6 1.5 1.5-4.4a8.4 8.4 0 1 1 15.5-4.5z" />
      <path d="M9.1 8.4c.3-.4.6-.5 1-.5h.4l.9 2.1-.6.9a6 6 0 0 0 2.4 2.4l.9-.6 2.1.9v.4c0 .4-.1.7-.5 1-1.6 1-5.6-.9-6.8-4.3-.3-.8-.2-1.7.2-2.3z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-5.5-5.5L19 12l-5.5 5.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
};

const StoreIcon = ({ name, className = 'size-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {PATHS[name]}
  </svg>
);

export default StoreIcon;
