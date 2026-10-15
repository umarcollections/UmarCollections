import {
  box,
  button,
  COLORS,
  escapeHtml,
  layout,
  pakistanTime,
  paragraph,
  rows,
  rupees,
  SANS,
  sectionTitle,
  textFooter,
} from './layout.js';

// Each function returns { to, subject, html, text } for sendEmail. Every email
// carries the full order: items, totals, delivery details and notes, so the
// customer (or owner) never has to open the site to know what it is about.
// Customers get two order emails: order placed and delivered (plus the
// forgot-password email in accountEmails.js). Guest order links contain a
// secret the database doesn't keep, so only the order-placed email links
// straight to a guest's order; customers with an account also get a link to
// their orders in the delivered email.

const STATUS_LABELS = {
  awaiting_payment: 'Awaiting payment',
  payment_submitted: 'Payment being checked',
  confirmed: 'Confirmed, being prepared',
  shipped: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const itemName = (item) => `${item.title}${item.variantLabel ? ` (${item.variantLabel})` : ''}`;

// Email apps need full image addresses and can't show SVG, so only uploaded
// photos (Cloudinary) are shown; the demo drawings are left out
const emailImage = (url) =>
  /^https:\/\/.+\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(url ?? '') ? url : null;

// Order number, date placed and where it stands
const orderHeader = (order) =>
  box(
    rows([
      ['Order number', String(order.orderNumber)],
      ['Placed', pakistanTime(order.createdAt)],
      ['Status', STATUS_LABELS[order.status] ?? order.status],
    ])
  );

const itemRow = (item) => {
  const image = emailImage(item.image);
  const cell = `padding:10px 0;border-bottom:1px solid ${COLORS.line};font:14px/1.5 ${SANS};color:${COLORS.text}`;
  return `<tr>
<td width="64" style="${cell};padding-right:12px;vertical-align:top">${
    image
      ? `<img src="${escapeHtml(image)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:12px;object-fit:cover;background:${COLORS.page}">`
      : `<div style="width:56px;height:56px;border-radius:12px;background:${COLORS.page}"></div>`
  }</td>
<td style="${cell};vertical-align:top"><strong>${escapeHtml(item.title)}</strong>${
    item.variantLabel
      ? `<br><span style="color:${COLORS.muted}">${escapeHtml(item.variantLabel)}</span>`
      : ''
  }<br><span style="color:${COLORS.muted}">${item.quantity} × ${rupees(item.price)}</span></td>
<td style="${cell};text-align:right;vertical-align:top;white-space:nowrap">${rupees(item.price * item.quantity)}</td>
</tr>`;
};

const totalPairs = (order) => [
  ['Subtotal', rupees(order.subtotal)],
  ...(order.discount
    ? [[`Discount (${order.discount.code})`, `-${rupees(order.discount.amount)}`]]
    : []),
  ['Delivery', order.shippingFee === 0 ? 'Free' : rupees(order.shippingFee)],
  ['Total', rupees(order.total)],
];

const itemsHtml = (order) =>
  sectionTitle('Items') +
  box(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${order.items
      .map(itemRow)
      .join(
        ''
      )}</table><div style="height:12px"></div>${rows(totalPairs(order), { boldLast: true })}`
  );

const itemsText = (order) =>
  [
    ...order.items.map(
      (item) =>
        `${itemName(item)}: ${item.quantity} x ${rupees(item.price)} = ${rupees(item.price * item.quantity)}`
    ),
    ...totalPairs(order).map(([label, value]) => `${label}: ${value}`),
  ].join('\n');

const addressLines = (order) =>
  [
    order.customer.name,
    order.customer.phone,
    order.shippingAddress.address,
    [order.shippingAddress.city, order.shippingAddress.postalCode].filter(Boolean).join(' '),
  ].filter(Boolean);

const deliveryHtml = (order) =>
  sectionTitle('Delivering to') +
  paragraph(addressLines(order).map(escapeHtml).join('<br>')) +
  (order.notes ? sectionTitle('Your notes') + paragraph(escapeHtml(order.notes)) : '');

const deliveryText = (order) =>
  `Delivering to:\n${addressLines(order).join('\n')}${order.notes ? `\n\nNotes: ${order.notes}` : ''}`;

const bankPairs = (account) => [
  ['Bank', account.bankName],
  ['Account title', account.accountTitle],
  ['Account number', account.accountNumber],
  ...(account.iban ? [['IBAN', account.iban]] : []),
];

const bankHtml = (order) =>
  sectionTitle('Pay to') +
  order.bankAccounts.map((account) => box(rows(bankPairs(account)))).join('') +
  paragraph(
    `Amount: <strong>${rupees(order.total)}</strong>. Write <strong>order ${order.orderNumber}</strong> in the transfer description if your bank allows it.`
  );

const bankText = (order) =>
  [
    ...order.bankAccounts.map((account) =>
      bankPairs(account)
        .map(([label, value]) => `${label}: ${value}`)
        .join('\n')
    ),
    `Amount: ${rupees(order.total)}. Write "order ${order.orderNumber}" in the transfer description if your bank allows it.`,
  ].join('\n\n');

// Customers with an account can open their orders from any email
const accountLink = (order, site) => (order.user && site ? `${site}/account#orders` : null);

const email = (order, { subject, preheader, heading, body, text }) => ({
  to: order.customer.email,
  subject,
  html: layout({ preheader, heading, body }),
  text: `${heading}\n\n${text}${textFooter}`,
});

export const orderPlacedEmail = (order, orderUrl) => {
  const due = pakistanTime(order.paymentDueAt);
  return email(order, {
    // A payment demand with an amount in the subject looks like the scam emails
    // spam filters hunt for; the amount and deadline are in the email itself
    subject: `We've received your order ${order.orderNumber} at Umar Collections`,
    preheader: `Pay ${rupees(order.total)} by ${due} to keep your order.`,
    heading: 'Thank you for your order',
    body:
      paragraph(
        `To complete order <strong>${order.orderNumber}</strong>, transfer <strong>${rupees(order.total)}</strong> to one of the accounts below by <strong>${escapeHtml(due)}</strong>. Then open your order and send us the transaction reference and a screenshot of the payment.`
      ) +
      orderHeader(order) +
      bankHtml(order) +
      button(orderUrl, 'Open your order') +
      paragraph(
        'Keep this email: the button is your private link to the order. Unpaid orders are cancelled after the deadline and the items go back on sale.'
      ) +
      itemsHtml(order) +
      deliveryHtml(order),
    text: [
      `To complete order ${order.orderNumber}, transfer ${rupees(order.total)} to one of these accounts by ${due}, then send us the transaction reference and a screenshot on your order page.`,
      `Placed: ${pakistanTime(order.createdAt)}`,
      bankText(order),
      `Your order (keep this link, it is private): ${orderUrl}`,
      itemsText(order),
      deliveryText(order),
    ].join('\n\n'),
  });
};

// Sent when the admin marks the order delivered. The returns wording matches
// section 8 of the Terms (damaged or wrong items only).
export const orderDeliveredEmail = (order, { site } = {}) => {
  const link = accountLink(order, site);
  const problem =
    'If anything arrived damaged, or you received the wrong item, reply to this email as soon as possible with your order number and photos of the item, and we will replace it or refund it.';
  return email(order, {
    subject: `Your order ${order.orderNumber} has been delivered`,
    preheader: 'Thank you for shopping with Umar Collections.',
    heading: 'Your order has been delivered',
    body:
      paragraph(
        `Order <strong>${order.orderNumber}</strong> has been delivered. Thank you for shopping with us, we hope you love it.`
      ) +
      orderHeader(order) +
      (link ? button(link, 'Open your orders') : '') +
      itemsHtml(order) +
      deliveryHtml(order) +
      sectionTitle('Something not right?') +
      paragraph(escapeHtml(problem)),
    text: [
      `Order ${order.orderNumber} has been delivered. Thank you for shopping with us, we hope you love it.`,
      itemsText(order),
      deliveryText(order),
      `Something not right? ${problem}`,
      link && `Your orders: ${link}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  });
};

// To the store owner: everything needed to act without opening the admin,
// including one-tap call and WhatsApp links to the customer

// "0300 1234567" -> "923001234567", for wa.me links
const whatsappNumber = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? `92${digits.slice(1)}` : digits;
};

const customerHtml = (order) =>
  sectionTitle('Customer') +
  paragraph(
    [
      escapeHtml(order.customer.name),
      `<a href="tel:${escapeHtml(order.customer.phone.replace(/[^\d+]/g, ''))}" style="color:${COLORS.accent}">${escapeHtml(order.customer.phone)}</a> · <a href="https://wa.me/${whatsappNumber(order.customer.phone)}" style="color:${COLORS.accent}">WhatsApp</a>`,
      `<a href="mailto:${escapeHtml(order.customer.email)}" style="color:${COLORS.accent}">${escapeHtml(order.customer.email)}</a>`,
      order.user ? 'Has an account' : 'Ordered as a guest',
    ].join('<br>')
  ) +
  sectionTitle('Deliver to') +
  paragraph(addressLines(order).slice(2).map(escapeHtml).join('<br>')) +
  (order.notes ? sectionTitle('Customer notes') + paragraph(escapeHtml(order.notes)) : '');

const customerText = (order) =>
  [
    `Customer: ${order.customer.name}, ${order.customer.phone}, ${order.customer.email}${order.user ? ' (has an account)' : ' (guest)'}`,
    `WhatsApp: https://wa.me/${whatsappNumber(order.customer.phone)}`,
    `Deliver to:\n${addressLines(order).slice(2).join('\n')}`,
    order.notes && `Customer notes: ${order.notes}`,
  ]
    .filter(Boolean)
    .join('\n');

export const ownerNewOrderEmail = (order, adminUrl, ownerEmail) => ({
  to: ownerEmail,
  subject: `New order ${order.orderNumber}: ${rupees(order.total)}`,
  html: layout({
    preheader: `${order.customer.name}, ${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}, waiting for payment`,
    heading: `New order ${order.orderNumber}`,
    body:
      paragraph(
        `A new order of <strong>${rupees(order.total)}</strong> is waiting for the customer to pay by <strong>${escapeHtml(pakistanTime(order.paymentDueAt))}</strong>.`
      ) +
      orderHeader(order) +
      button(adminUrl, 'Open in admin') +
      itemsHtml(order) +
      customerHtml(order),
  }),
  text: [
    `New order ${order.orderNumber}: ${rupees(order.total)}, waiting for payment until ${pakistanTime(order.paymentDueAt)}.`,
    `Placed: ${pakistanTime(order.createdAt)}`,
    adminUrl,
    itemsText(order),
    customerText(order),
  ].join('\n\n'),
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
          `${escapeHtml(order.customer.name)} says they have paid <strong>${rupees(order.total)}</strong> for order <strong>${order.orderNumber}</strong>. Check your account for this amount and reference, then confirm or reject it.`
        ) +
        box(
          rows([
            ['Amount to find', rupees(order.total)],
            ['Reference', order.payment.reference],
            ['Sent', pakistanTime(order.payment.submittedAt ?? new Date())],
          ])
        ) +
        (screenshot
          ? paragraph(
              `<a href="${escapeHtml(screenshot)}" style="color:${COLORS.accent}">View the payment screenshot</a>`
            )
          : '') +
        button(adminUrl, 'Confirm or reject in admin') +
        itemsHtml(order) +
        customerHtml(order),
    }),
    text: [
      `${order.customer.name} says they have paid ${rupees(order.total)} for order ${order.orderNumber}.`,
      `Reference: ${order.payment.reference}${screenshot ? `\nScreenshot: ${screenshot}` : ''}`,
      `Confirm or reject it: ${adminUrl}`,
      itemsText(order),
      customerText(order),
    ].join('\n\n'),
  };
};
