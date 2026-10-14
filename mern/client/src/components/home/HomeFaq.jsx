import SectionHeading from '../store/SectionHeading.jsx';
import store from '../../lib/store.js';

// Answers to what shoppers ask before ordering. Each one restates the Terms
// and Conditions or how the shop works, so update them together.
const questionsFor = (settings) => [
  {
    question: `Where does ${store.name} deliver?`,
    answer: `We deliver within ${store.city} only. Once your payment is confirmed we arrange delivery and contact you on the phone number you gave at checkout.`,
  },
  {
    question: 'How do I pay for my order?',
    answer: `By bank transfer. After you place your order you see our bank details. Pay within ${
      settings ? `${settings.paymentWindowHours} hours` : 'the time shown on your order page'
    } and send the transaction reference on your order page. Your items are held for you while you pay.`,
  },
  {
    question: 'Do I need an account to order?',
    answer:
      'No, you can check out as a guest. An account keeps all the orders you place in one place.',
  },
  {
    question: 'How do I know my size is in stock?',
    answer:
      'Every product page shows the sizes, the fabric and how many are in stock right now. A size that shows as in stock is on the shelf, and your order holds it for you.',
  },
  {
    question: 'Can I return or exchange an item?',
    answer:
      'We do not accept returns or exchanges if you change your mind. If an item arrives damaged or you receive the wrong one, email us with your order number and photos and we will replace it, or refund it if a replacement is not available.',
  },
  {
    question: `How can I contact ${store.name}?`,
    answer: `Call or WhatsApp ${store.phone}, email ${store.email}, or find us at ${store.address}.`,
  },
];

// Common questions on the home page, each opening in place
const HomeFaq = ({ settings }) => (
  <section className="mx-auto grid max-w-7xl gap-14 px-4 py-24 sm:px-8 lg:grid-cols-[1fr_1.4fr] lg:py-32">
    <SectionHeading eyebrow="Questions" title="Good to know before you order" />
    <div data-reveal>
      {questionsFor(settings).map(({ question, answer }) => (
        <details
          key={question}
          className="group border-t border-espresso-900/10 py-6 last:border-b"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-2xl leading-snug text-espresso-900">{question}</h3>
            <span
              aria-hidden="true"
              className="text-2xl text-tangerine-700 transition-transform duration-300 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-espresso-800">{answer}</p>
        </details>
      ))}
    </div>
  </section>
);

export default HomeFaq;
