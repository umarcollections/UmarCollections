import env from '../../config/env.js';

const CALLMEBOT_URL = 'https://api.callmebot.com/whatsapp.php';
const TIMEOUT_MS = 5000;

const rupees = (amount) => `Rs ${amount.toLocaleString('en-PK')}`;

const itemList = (items) =>
  items
    .map(
      (item) =>
        `${item.title}${item.variantLabel ? ` (${item.variantLabel})` : ''} x${item.quantity}`
    )
    .join(', ');

// Sends a WhatsApp message to the store owner through CallMeBot. An alert is a
// convenience: if it fails the order still goes through, and the reason is logged.
// Awaited by the caller because serverless hosts stop work left running after the response.
export const sendOwnerAlert = async (text) => {
  if (!env.whatsappAlerts.enabled) return false;

  const url = new URL(CALLMEBOT_URL);
  url.search = new URLSearchParams({
    phone: env.whatsappAlerts.phone,
    text,
    apikey: env.whatsappAlerts.apiKey,
  });
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`CallMeBot answered ${res.status}`);
    return true;
  } catch (error) {
    console.error('WhatsApp alert failed:', error.message);
    return false;
  }
};

export const newOrderAlert = (order, adminUrl) =>
  [
    `New order ${order.orderNumber}: ${rupees(order.total)}`,
    `${order.customer.name}, ${order.customer.phone}`,
    itemList(order.items),
    'Waiting for the customer to pay.',
    adminUrl,
  ].join('\n');

export const paymentSentAlert = (order, adminUrl) =>
  [
    `Payment sent for order ${order.orderNumber}: ${rupees(order.total)}`,
    `${order.customer.name}, reference ${order.payment.reference}`,
    'Check your account, then confirm or reject it:',
    adminUrl,
  ].join('\n');
