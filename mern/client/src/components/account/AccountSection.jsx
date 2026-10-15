// The card holding the open section of the account page. The id lets links
// open it directly (e.g. /account#addresses from the header menu); scroll-mt
// keeps the heading clear of the sticky header.
const AccountSection = ({ id, eyebrow, title, description, children }) => (
  <section
    id={id}
    aria-labelledby={`${id}-title`}
    className="min-w-0 scroll-mt-28 rounded-[2rem] bg-cream-50 p-6 shadow-xl shadow-espresso-900/5 ring-1 ring-caramel-300/40 sm:p-10"
  >
    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700">
      {eyebrow}
    </p>
    <h2 id={`${id}-title`} className="mt-3 font-display text-4xl leading-tight text-espresso-900">
      {title}
    </h2>
    {description && (
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-espresso-800">{description}</p>
    )}
    <div className="mt-8">{children}</div>
  </section>
);

export default AccountSection;
