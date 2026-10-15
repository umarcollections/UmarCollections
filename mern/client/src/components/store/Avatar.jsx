// Initials of the first two words of the name, e.g. "Bilal Khawar" -> "BK"
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

// Round initials badge for a signed-in customer. Decorative: the button or
// text next to it carries the name.
const Avatar = ({ name, className = 'size-9 text-xs' }) => (
  <span
    aria-hidden="true"
    className={`grid shrink-0 place-items-center rounded-full bg-espresso-900 font-semibold tracking-wide text-cream-50 ${className}`}
  >
    {initials(name)}
  </span>
);

export default Avatar;
