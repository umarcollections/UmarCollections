// Small spaced eyebrow over a large serif heading whose words rise in on scroll
const SectionHeading = ({ eyebrow, title, align = 'left', className = '' }) => (
  <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
    {eyebrow && (
      <p
        data-reveal
        className="text-[11px] font-semibold uppercase tracking-[0.28em] text-tangerine-700"
      >
        {eyebrow}
      </p>
    )}
    <h2
      data-split
      className="mt-3 font-display text-4xl leading-[1.05] text-espresso-900 sm:text-5xl lg:text-6xl"
    >
      {title}
    </h2>
  </div>
);

export default SectionHeading;
