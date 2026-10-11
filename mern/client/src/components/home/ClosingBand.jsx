import StoreButton from '../store/StoreButton.jsx';

// The last thing on the home page: a warm gradient band pointing to the full shop
const ClosingBand = ({ total }) => (
  <section className="px-4 pb-24 sm:px-8">
    <div
      data-reveal
      className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ember px-6 py-20 text-center text-white sm:px-16"
    >
      <div
        aria-hidden="true"
        className="absolute -left-20 -top-20 size-80 rounded-full bg-cream-50/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-10 size-96 rounded-full bg-espresso-900/20 blur-3xl"
      />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.28em] text-cream-100">
        The full collection
      </p>
      <h2
        data-split
        className="relative mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-6xl"
      >
        {total ? `Browse all ${total} pieces in the shop` : 'Browse everything in the shop'}
      </h2>
      <StoreButton to="/shop" variant="light" className="relative mt-10">
        Shop all products
      </StoreButton>
    </div>
  </section>
);

export default ClosingBand;
