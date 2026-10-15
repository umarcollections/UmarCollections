import StoreIcon from '../store/StoreIcon.jsx';

// "Nothing here yet" inside an account section: a round icon, a line of text
// and the next step
const EmptyState = ({ icon, title, text, children }) => (
  <div className="flex flex-col items-center rounded-3xl border border-dashed border-caramel-300 px-6 py-12 text-center">
    <span className="grid size-16 place-items-center rounded-full bg-cream-200 text-caramel-700">
      <StoreIcon name={icon} className="size-7" />
    </span>
    <p className="mt-5 font-display text-2xl text-espresso-900">{title}</p>
    <p className="mt-2 max-w-sm text-sm leading-relaxed text-espresso-800">{text}</p>
    {children && <div className="mt-6">{children}</div>}
  </div>
);

export default EmptyState;
