import { Link } from 'react-router-dom';
import LegalPage from '../../components/legal/LegalPage.jsx';
import LegalSection from '../../components/legal/LegalSection.jsx';
import useSettings from '../../hooks/settings/useSettings.js';
import store from '../../lib/store.js';

// Describes how this store actually works. The payment window comes from the
// admin settings, so it stays correct when it is changed there.
const TermsPage = () => {
  const { data: settings } = useSettings();
  const paymentWindow = settings
    ? `${settings.paymentWindowHours} hours`
    : 'the time shown on your order page';

  return (
    <LegalPage title="Terms and Conditions" updated="10 October 2026">
      <p className="text-espresso-800">
        These terms apply when you buy from {store.name}. Please read them before placing an order.
      </p>

      <LegalSection title="1. About us">
        <p>
          This website is run by {store.name}, {store.address}. You can reach us by email at{' '}
          {store.email}, or by phone and WhatsApp on {store.phone}.
        </p>
      </LegalSection>

      <LegalSection title="2. Orders">
        <p>
          Placing an order is an offer to buy. We accept it when we confirm your payment. From the
          moment you place the order, the items are held for you until your payment deadline.
        </p>
        <p>
          If an item cannot be supplied, for example because of a stock or price mistake on our
          side, we will contact you. You can then cancel the order and get back anything you have
          paid.
        </p>
      </LegalSection>

      <LegalSection title="3. Prices">
        <p>
          Prices are in {store.currency}. The total on the checkout page, including delivery and any
          discount, is the amount you pay.
        </p>
      </LegalSection>

      <LegalSection title="4. Payment">
        <ul>
          <li>
            We accept payment by bank transfer only, to the accounts shown on your order page.
          </li>
          <li>After paying, send us the transaction reference on your order page.</li>
          <li>
            Please pay within {paymentWindow} of placing your order. Unpaid orders are cancelled
            automatically and the items go back on sale.
          </li>
          <li>
            If we cannot find your payment, we will say so on your order page and give you more time
            to send the right details.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Discount codes">
        <p>
          One code per order. Codes cannot be exchanged for cash and may have a minimum spend, an
          expiry date or a limited number of uses. If an order with a code is cancelled, the code
          can be used again.
        </p>
      </LegalSection>

      <LegalSection title="6. Delivery">
        <p>
          We deliver within {store.city} only. We arrange delivery once your payment is confirmed
          and contact you on the phone number you gave us. Please check that your address and phone
          number are correct.
        </p>
      </LegalSection>

      <LegalSection title="7. Cancelling an order">
        <p>
          Email us before your order is shipped if you want to cancel it. If you have already paid,
          we refund the full amount by bank transfer.
        </p>
      </LegalSection>

      <LegalSection title="8. Returns">
        <p>We do not accept returns or exchanges if you change your mind.</p>
        <p>
          If an item arrives damaged, or you receive the wrong item, email us as soon as possible
          with your order number and photos of the item. We will replace it, or refund it by bank
          transfer if a replacement is not available.
        </p>
      </LegalSection>

      <LegalSection title="9. Your account">
        <p>
          You do not need an account to buy. If you create one, keep your password to yourself; you
          are responsible for orders placed while signed in to it.
        </p>
      </LegalSection>

      <LegalSection title="10. Your details">
        <p>
          How we handle your details is explained in our{' '}
          <Link to="/privacy" className="text-espresso-900 underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to these terms">
        <p>
          We may update these terms. The version on this page when you place an order is the one
          that applies to it.
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default TermsPage;
