import SectionHeading from '../store/SectionHeading.jsx';
import StoreButton from '../store/StoreButton.jsx';
import store from '../../lib/store.js';

// Each point is something the store actually does
const POINTS = [
  [
    'Fabric and care on every product',
    'Read what it is made of and how to wash it before you buy.',
  ],
  [
    'Live stock for every size',
    'If a size shows in stock, it is on the shelf and held for you at checkout.',
  ],
  ['Pay by bank transfer', 'No card details needed. Transfer from your own bank or app.'],
  ['Delivered to your door', `We deliver within ${store.city} once your payment is confirmed.`],
];

// Artwork on one side with a slow parallax, how buying works on the other
const EditorialSplit = () => (
  <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
    <div
      data-reveal-img
      className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-caramel-300"
    >
      <img
        data-parallax="16"
        src="/demo/editorial.svg"
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full scale-125 object-cover"
      />
    </div>

    <div>
      <SectionHeading eyebrow="How it works" title="Everything you need to choose well" />
      <ol className="mt-12 space-y-8">
        {POINTS.map(([title, text], i) => (
          <li key={title} data-reveal className="flex gap-6 border-t border-espresso-900/10 pt-6">
            <span className="font-display text-3xl italic text-ember">0{i + 1}</span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.15em] text-espresso-900">
                {title}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-espresso-800">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <div data-reveal className="mt-12">
        <StoreButton to="/about" variant="outline">
          About us
        </StoreButton>
      </div>
    </div>
  </section>
);

export default EditorialSplit;
