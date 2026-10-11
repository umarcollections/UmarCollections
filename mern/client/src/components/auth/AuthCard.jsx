// Single-card version of the login page's look, for the forgot-password and
// reset-password pages
const AuthCard = ({ children }) => (
  <section className="relative -mt-16 overflow-hidden bg-glow pt-16 lg:-mt-20 lg:pt-20">
    <div
      aria-hidden="true"
      className="absolute -left-32 top-20 size-[26rem] rounded-full bg-cream-50/60 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="absolute -bottom-24 -right-24 size-[30rem] rounded-full bg-tangerine-400/40 blur-3xl"
    />
    <div className="relative mx-auto max-w-xl px-4 py-14 sm:px-8 lg:py-20">
      <div className="rounded-[2.5rem] bg-cream-50 p-8 shadow-2xl shadow-espresso-900/15 sm:p-12">
        {children}
      </div>
    </div>
  </section>
);

export default AuthCard;
