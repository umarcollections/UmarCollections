// A numbered heading and its paragraphs or lists on a legal page
const LegalSection = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="font-display text-2xl text-espresso-900">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-espresso-800 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      {children}
    </div>
  </section>
);

export default LegalSection;
