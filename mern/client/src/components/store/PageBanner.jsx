// Gradient banner at the top of shop, collections and about pages. It runs
// under the transparent header, like the home page hero.
const PageBanner = ({ eyebrow, title, text, children }) => (
  <section className="relative -mt-16 overflow-hidden bg-glow pt-16 lg:-mt-20 lg:pt-20">
    <div
      aria-hidden="true"
      className="absolute -right-24 -top-24 size-96 rounded-full bg-tangerine-400/30 blur-3xl"
    />
    <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-8 lg:pb-20 lg:pt-20">
      {eyebrow && (
        <p
          data-reveal
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-espresso-800"
        >
          {eyebrow}
        </p>
      )}
      <h1
        data-split
        className="mt-4 max-w-4xl font-display text-5xl leading-[1] text-espresso-900 sm:text-7xl"
      >
        {title}
      </h1>
      {text && (
        <p data-reveal className="mt-6 max-w-xl text-base leading-relaxed text-espresso-800">
          {text}
        </p>
      )}
      {children}
    </div>
  </section>
);

export default PageBanner;
