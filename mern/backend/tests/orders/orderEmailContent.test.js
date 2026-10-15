import { describe, expect, it } from 'vitest';
import {
  orderDeliveredEmail,
  orderPlacedEmail,
  ownerNewOrderEmail,
  ownerPaymentSentEmail,
} from '../../src/utils/email/orderEmails.js';

// A finished order as the database holds it: 2 lines, a discount and delivery
const order = (overrides = {}) => ({
  _id: '6acb629ca207a66a6a139688',
  orderNumber: 1004,
  status: 'awaiting_payment',
  user: null,
  createdAt: new Date('2026-10-16T09:10:00Z'),
  paymentDueAt: new Date('2026-10-18T09:10:00Z'),
  customer: { name: 'Ayesha Khan', email: 'ayesha@example.com', phone: '0300 1234567' },
  shippingAddress: {
    address: 'House 12, Street 4, Gulberg',
    city: 'Faisalabad',
    postalCode: '38000',
  },
  notes: 'Please call before delivery',
  items: [
    {
      title: 'Wool Scarf',
      variantLabel: 'Rust',
      quantity: 1,
      price: 3200,
      image: 'https://res.cloudinary.com/demo/image/upload/scarf.jpg',
    },
    {
      title: 'Leather Belt',
      variantLabel: 'Brown / 34',
      quantity: 2,
      price: 3250,
      image: '/demo/belt.svg',
    },
  ],
  subtotal: 9700,
  discount: { code: 'EID10', amount: 500 },
  shippingFee: 250,
  total: 9450,
  bankAccounts: [
    { bankName: 'JazzCash', accountTitle: 'Umar Shabir', accountNumber: '0307 4801091' },
  ],
  payment: {
    reference: 'TRX-778899',
    rejectionNote: 'Amount was Rs 9,000',
    screenshot: { url: 'https://res.cloudinary.com/demo/p.png' },
  },
  shipment: { courier: 'TCS', trackingNumber: 'TCS-1234567' },
  ...overrides,
});

const SITE = 'https://umarcollections.vercel.app';

describe('order email content', () => {
  it('order placed: every item, the totals, payment details, delivery and notes', () => {
    const { subject, html, text } = orderPlacedEmail(order(), `${SITE}/orders/1004?key=secret`);

    expect(subject).toBe("We've received your order 1004 at Umar Collections");
    for (const content of [html, text]) {
      expect(content).toContain('Wool Scarf');
      expect(content).toContain('Leather Belt');
      expect(content).toContain('Brown / 34');
      expect(content).toContain('Rs 6,500');
      expect(content).toContain('Rs 9,700');
      expect(content).toContain('EID10');
      expect(content).toContain('-Rs 500');
      expect(content).toContain('Rs 250');
      expect(content).toContain('Rs 9,450');
      expect(content).toContain('JazzCash');
      expect(content).toContain('0307 4801091');
      expect(content).toContain('House 12, Street 4, Gulberg');
      expect(content).toContain('Faisalabad 38000');
      expect(content).toContain('Please call before delivery');
      expect(content).toContain(`${SITE}/orders/1004?key=secret`);
    }
    expect(html).toContain('2 × Rs 3,250');
    expect(text).toContain('Leather Belt (Brown / 34): 2 x Rs 3,250 = Rs 6,500');
  });

  it('shows dates in Pakistan time, whatever the server clock', () => {
    const { html, text } = orderPlacedEmail(order(), `${SITE}/orders/1004?key=k`);
    // 09:10 UTC is 2:10 pm in Pakistan
    expect(text).toMatch(/16 Oct 2026.*2:10\s*pm/i);
    expect(html).toMatch(/18 Oct 2026.*2:10\s*pm/i);
  });

  it('shows uploaded photos but not the demo drawings, which email apps cannot show', () => {
    const { html } = orderPlacedEmail(order(), `${SITE}/orders/1004?key=k`);
    expect(html).toContain('<img src="https://res.cloudinary.com/demo/image/upload/scarf.jpg"');
    expect(html).not.toContain('belt.svg');
  });

  it('delivered: thanks, the items, and what to do if something is wrong', () => {
    const { subject, html, text } = orderDeliveredEmail(order({ status: 'delivered' }));
    expect(subject).toBe('Your order 1004 has been delivered');
    expect(html).toContain('Wool Scarf');
    expect(text).toContain('Total: Rs 9,450');
    expect(text).toContain('damaged');
    expect(text).toContain('photos');
  });

  it('links customers with an account to their orders, never guests', () => {
    const member = orderDeliveredEmail(order({ user: 'u1', status: 'delivered' }), { site: SITE });
    const guest = orderDeliveredEmail(order({ status: 'delivered' }), { site: SITE });

    expect(member.html).toContain(`${SITE}/account#orders`);
    expect(guest.html).not.toContain('/account#orders');
    expect(member.html).toContain('Delivered');
  });

  it("owner emails: the customer's contact links, address, notes and screenshot", () => {
    const fresh = ownerNewOrderEmail(order(), `${SITE}/admin/orders/1`, 'owner@store.test');
    const paid = ownerPaymentSentEmail(
      order({ status: 'payment_submitted' }),
      `${SITE}/admin/orders/1`,
      'owner@store.test'
    );

    expect(fresh.to).toBe('owner@store.test');
    expect(fresh.html).toContain('https://wa.me/923001234567');
    expect(fresh.html).toContain('tel:03001234567');
    expect(fresh.html).toContain('mailto:ayesha@example.com');
    expect(fresh.html).toContain('Please call before delivery');
    expect(fresh.html).toContain('Ordered as a guest');
    expect(fresh.html).not.toContain('key=');
    expect(paid.html).toContain('TRX-778899');
    expect(paid.html).toContain('https://res.cloudinary.com/demo/p.png');
    expect(paid.html).toContain('Rs 9,450');
  });
});
