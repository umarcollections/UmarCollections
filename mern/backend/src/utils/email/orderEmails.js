import {
  box,
  button,
  escapeHtml,
  layout,
  pakistanTime,
  paragraph,
  rows,
  rupees,
  sectionTitle,
  textFooter,
} from './layout.js';

// Each function returns { to, subject, html, text } for sendEmail.
// Guest order links contain a secret the database doesn't keep, so only the
// order-placed email can link to the order; later emails point back to it.

const itemName = (item) => `${item.title}${item.variantLabel ? ` (${item.variantLabel})` : ''}`;

const summaryPairs = (order) => [
  ...order.items.map((item) => [
    `${itemName(item)} x${item.quantity}`,
    rupees(item.price * item.quantity),
  ]),
  ...(order.discount
    ? [[`Discount (${order.discount.code})`, `-${rupees(order.discount.amount)}`]]
    : []),
  ['Delivery', order.shippingFee === 0 ? 'Free' : rupees(order.shippingFee)],
  ['Total', rupees(order.total)],
];

const summaryHtml = (order) =>
  sectionTitle('Your order') + box(rows(summaryPairs(order), { boldLast: true }));

const summaryText = (order) =>
  summaryPairs(order)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');

const bankPairs = (account) => [
  ['Bank', account.bankName],
  ['Account title', account.accountTitle],
  ['Account number', account.accountNumber],
  ...(account.iban ? [['IBAN', account.iban]] : []),
];

const addressLines = (order) =>
  [
    order.customer.name,
    order.customer.phone,
    order.shippingAddress.address,
    [order.shippingAddress.city, order.shippingAddress.postalCode].filter(Boolean).join(' '),
  ].filter(Boolean);

const email = (order, { subject, preheader, heading, body, text }) => ({
  to: order.customer.email,
  subject,
  html: layout({ preheader, heading, body }),
  text: `${heading}\n\n${text}${textFooter}`,
});

export const orderPlacedEmail = (order, orderUrl) => {
  const due = pakistanTime(order.paymentDueAt);
  return email(order, {
    subject: `Order ${order.orderNumber}: please pay ${rupees(order.total)} by bank transfer`,
    preheader: `Pay by ${due} to keep your order.`,
    heading: 'Thank you for your order',
    body:
      paragraph(
        `To complete order <strong>${order.orderNumber}</strong>, transfer <strong>${rupees(order.total)}</strong> to one of the accounts below by <strong>${escapeHtml(due)}</strong>. Then open your order and send us the transaction reference and a screenshot of the payment.`
      ) +
      sectionTitle('Pay to') +
      order.bankAccounts.map((account) => box(rows(bankPairs(account)))).join('') +
      paragraph(
        `Write <strong>order ${order.orderNumber}</strong> in the transfer description if your bank allows it.`
      ) +
      button(orderUrl, 'Open your order') +
      paragraph(
        'Keep this email: the button is your private link to the order. Unpaid orders are cancelled after the deadline and the items go back on sale.'
      ) +
      summaryHtml(order) +
      sectionTitle('Delivering to') +
      paragraph(addressLines(order).map(escapeHtml).join('<br>')),
    text: [
      `To complete order ${order.orderNumber}, transfer ${rupees(order.total)} to one of these accounts by ${due}, then send us the transaction reference and a screenshot on your order page.`,
      ...order.bankAccounts.map((account) =>
        bankPairs(account)
          .map(([label, value]) => `${label}: ${value}`)
          .join('\n')
      ),
      `Your order (keep this link, it is private): ${orderUrl}`,
      summaryText(order),
      `Delivering to:\n${addressLines(order).join('\n')}`,
    ].join('\n\n'),
  });
};

export const paymentConfirmedEmail = (order) =>
  email(order, {
    subject: `Order ${order.orderNumber}: payment received`,
    preheader: "We're preparing your order.",
    heading: 'Payment received',
    body:
      paragraph(
        `Thank you. We've received your payment of <strong>${rupees(order.total)}</strong> for order <strong>${order.orderNumber}</strong>. We're preparing it now and will email you when it's on its way.`
      ) + summaryHtml(order),
    text: `We've received your payment of ${rupees(order.total)} for order ${order.orderNumber}. We're preparing it now and will email you when it's on its way.\n\n${summaryText(order)}`,
  });

export const paymentRejectedEmail = (order) => {
  const due = pakistanTime(order.paymentDueAt);
  const reason = order.payment?.rejectionNote ?? '';
  return email(order, {
    subject: `Order ${order.orderNumber}: we couldn't match your payment`,
    preheader: `Please send the right details by ${due}.`,
    heading: "We couldn't match your payment",
    body:
      paragraph(
        `We checked the payment details for order <strong>${order.orderNumber}</strong> and couldn't match them to a payment.`
      ) +
      box(paragraph(`<strong>Reason:</strong> ${escapeHtml(reason)}`)) +
      paragraph(
        `Please send the correct reference and screenshot by <strong>${escapeHtml(due)}</strong>, using the link in your order confirmation email (or from your account if you ordered while signed in). After that the order is cancelled.`
      ),
    text: `We couldn't match the payment details for order ${order.orderNumber} to a payment.\n\nReason: ${reason}\n\nPlease send the correct reference and screenshot by ${due}, using the link in your order confirmation email (or from your account if you ordered while signed in). After that the order is cancelled.`,
  });
};

export const orderShippedEmail = (order) => {
  const { courier, trackingNumber } = order.shipment ?? {};
  const tracking = [
    ...(courier ? [['Courier', courier]] : []),
    ...(trackingNumber ? [['Tracking number', trackingNumber]] : []),
  ];
  return email(order, {
    subject: `Order ${order.orderNumber} is on its way`,
    preheader: 'Your order has left us.',
    heading: 'Your order is on its way',
    body:
      paragraph(`Order <strong>${order.orderNumber}</strong> has been sent to you.`) +
      (tracking.length ? box(rows(tracking)) : '') +
      sectionTitle('Delivering to') +
      paragraph(addressLines(order).map(escapeHtml).join('<br>')),
    text: [
      `Order ${order.orderNumber} has been sent to you.`,
      tracking.map(([label, value]) => `${label}: ${value}`).join('\n'),
      `Delivering to:\n${addressLines(order).join('\n')}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  });
};

// expired: cancelled automatically because no payment arrived in time
export const orderCancelledEmail = (order, { reason, expired = false }) => {
  const why = expired
    ? "We didn't receive payment in time, so the items have gone back on sale. You're welcome to order again."
    : `${reason ? `Reason: ${reason}. ` : ''}If you have already paid, reply to this email or WhatsApp us and we'll arrange your refund.`;
  return email(order, {
    subject: `Order ${order.orderNumber} has been cancelled`,
    preheader: expired ? 'Payment was not received in time.' : 'Your order was cancelled.',
    heading: 'Your order has been cancelled',
    body:
      paragraph(`Order <strong>${order.orderNumber}</strong> has been cancelled.`) +
      paragraph(escapeHtml(why)),
    text: `Order ${order.orderNumber} has been cancelled.\n\n${why}`,
  });
};

// To the store owner
export const ownerNewOrderEmail = (order, adminUrl, ownerEmail) => ({
  to: ownerEmail,
  subject: `New order ${order.orderNumber}: ${rupees(order.total)}`,
  html: layout({
    preheader: `${order.customer.name}, waiting for payment`,
    heading: `New order ${order.orderNumber}`,
    body:
      paragraph('A new order is waiting for the customer to pay.') +
      button(adminUrl, 'Open in admin') +
      summaryHtml(order) +
      sectionTitle('Customer') +
      paragraph([...addressLines(order), order.customer.email].map(escapeHtml).join('<br>')) +
      (order.notes ? sectionTitle('Notes') + paragraph(escapeHtml(order.notes)) : ''),
  }),
  text: `New order ${order.orderNumber}, waiting for payment.\n${adminUrl}\n\n${summaryText(order)}\n\nCustomer:\n${[...addressLines(order), order.customer.email].join('\n')}${order.notes ? `\n\nNotes: ${order.notes}` : ''}`,
});

export const ownerPaymentSentEmail = (order, adminUrl, ownerEmail) => {
  const screenshot = order.payment?.screenshot?.url;
  return {
    to: ownerEmail,
    subject: `Payment to check: order ${order.orderNumber}, ${rupees(order.total)}`,
    html: layout({
      preheader: `Reference ${order.payment.reference}`,
      heading: 'Payment to check',
      body:
        paragraph(
          `${escapeHtml(order.customer.name)} says they have paid <strong>${rupees(order.total)}</strong> for order <strong>${order.orderNumber}</strong>. Check your account, then confirm or reject it.`
        ) +
        box(rows([['Reference', order.payment.reference]])) +
        (screenshot
          ? paragraph(
              `<a href="${escapeHtml(screenshot)}" style="color:#9a4a1c">View the payment screenshot</a>`
            )
          : '') +
        button(adminUrl, 'Open in admin'),
    }),
    text: `${order.customer.name} says they have paid ${rupees(order.total)} for order ${order.orderNumber}.\nReference: ${order.payment.reference}${screenshot ? `\nScreenshot: ${screenshot}` : ''}\n\nConfirm or reject it: ${adminUrl}`,
  };
};
