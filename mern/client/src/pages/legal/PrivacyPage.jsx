import LegalPage from '../../components/legal/LegalPage.jsx';
import LegalSection from '../../components/legal/LegalSection.jsx';
import store from '../../lib/store.js';

// Describes what this site actually does. If you add analytics, email
// marketing or anything else that uses customer data, update this page first.
const PrivacyPage = () => (
  <LegalPage title="Privacy Policy" updated="10 October 2026">
    <p className="text-espresso-800">
      This page explains what {store.name} collects when you use this website, why we collect it,
      and who we share it with.
    </p>

    <LegalSection title="1. What we collect">
      <p>When you place an order:</p>
      <ul>
        <li>your name, email address and phone number</li>
        <li>your delivery address, city, postal code (if you give one) and any delivery notes</li>
        <li>what you ordered, and the discount code you used, if any</li>
      </ul>
      <p>When you tell us you have paid:</p>
      <ul>
        <li>the transaction reference from your bank or app</li>
        <li>a screenshot of the payment, if you choose to upload one</li>
      </ul>
      <p>
        If you create an account: your name, email address and password. The password is stored only
        in a scrambled (hashed) form, so nobody, including us, can read it.
      </p>
      <p>
        We never see your card or bank login details. You pay by bank transfer from your own bank or
        app.
      </p>
    </LegalSection>

    <LegalSection title="2. Why we use it">
      <ul>
        <li>to match your payment with the money in our bank account</li>
        <li>to deliver your order</li>
        <li>to contact you about your order</li>
      </ul>
      <p>We do not use your details for advertising.</p>
    </LegalSection>

    <LegalSection title="3. Who we share it with">
      <ul>
        <li>
          The person or company delivering your order receives your name, phone number and address.
        </li>
        <li>
          The companies that host this website, its database and uploaded images store your details
          on our behalf.
        </li>
      </ul>
      <p>We do not sell your details to anyone.</p>
    </LegalSection>

    <LegalSection title="4. Cookies and storage in your browser">
      <ul>
        <li>
          If you log in, we set one cookie that keeps you signed in. Scripts on the page cannot read
          it, and it is removed when you log out or when it expires.
        </li>
        <li>
          Your cart and any discount code you enter are saved in your own browser so they are still
          there when you come back. They are only sent to us when you look at your cart or check
          out.
        </li>
        <li>
          The site loads its font from Google Fonts, so your browser connects to Google&apos;s
          servers when a page opens.
        </li>
      </ul>
      <p>We do not use analytics or advertising trackers.</p>
    </LegalSection>

    <LegalSection title="5. Your order link">
      <p>
        After you place an order you get a private link to it. Anyone who has that link can see the
        order, including your name, phone number and address, so keep it to yourself. If you were
        signed in when you ordered, you can also find the order in your account.
      </p>
    </LegalSection>

    <LegalSection title="6. How long we keep it">
      <p>
        We keep order details for our sales records. If we reject a payment, we delete the
        screenshot you sent with it. Your account stays until you ask us to delete it.
      </p>
    </LegalSection>

    <LegalSection title="7. Your choices">
      <p>
        Email us at {store.email} or message us on WhatsApp at {store.phone} to see the details we
        hold about you, correct them, or ask us to delete them. We may need to keep records of past
        orders where the law requires it.
      </p>
    </LegalSection>

    <LegalSection title="8. Changes to this page">
      <p>If we change how we use your details, we will update this page and the date at the top.</p>
    </LegalSection>
  </LegalPage>
);

export default PrivacyPage;
