import env from '../../config/env.js';
import Order from '../../models/order.model.js';
import ApiError from '../../utils/ApiError.js';
import { deleteImage, isImageStorageReady, uploadImage } from '../../utils/imageStorage.js';
import { orderKeyMatches } from '../../utils/orders/orderKey.js';
import placeOrder from '../../utils/orders/placeOrder.js';
import { priceCart } from '../../utils/orders/pricing.js';
import {
  newOrderAlert,
  paymentSentAlert,
  sendOwnerAlert,
} from '../../utils/orders/whatsappAlert.js';
import {
  orderPlacedEmail,
  ownerNewOrderEmail,
  ownerPaymentSentEmail,
} from '../../utils/email/orderEmails.js';
import sendEmail from '../../utils/email/sendEmail.js';
import siteUrl from '../../utils/siteUrl.js';

// Customer-facing order routes. Guests prove an order is theirs with the key
// from their order link (?key=...); signed-in customers can also open orders
// they placed while signed in.

const adminOrderUrl = (req, order) => `${siteUrl(req)}/admin/orders/${order._id}`;

const ownsOrder = (user, order) => Boolean(user && order.user?.equals(user._id));

// A wrong number and a wrong key get the same answer, so order numbers can't be probed
const findCustomerOrder = async (orderNumber, key, user) => {
  const order = /^\d+$/.test(orderNumber)
    ? await Order.findOne({ orderNumber: Number(orderNumber) }).select('+accessKeyHash')
    : null;
  if (!order || !(ownsOrder(user, order) || orderKeyMatches(key, order.accessKeyHash))) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};

// POST /api/orders/quote
// Current prices, stock and totals for the cart page and checkout summary
export const quoteCart = async (req, res) => {
  const quote = await priceCart(req.body.items, req.body.discountCode);
  // Listed one by one so internal fields (settings, the discount record) never reach the browser
  res.json({
    success: true,
    data: {
      lines: quote.lines,
      subtotal: quote.subtotal,
      discount: quote.discount,
      discountError: quote.discountError,
      shippingFee: quote.shippingFee,
      total: quote.total,
      ready: quote.ready,
      checkoutOpen: quote.settings.bankAccounts.length > 0,
    },
  });
};

// POST /api/orders
export const createOrder = async (req, res) => {
  const { order, key } = await placeOrder({ ...req.body, userId: req.user?._id });
  const orderUrl = `${siteUrl(req)}/orders/${order.orderNumber}?key=${encodeURIComponent(key)}`;
  const adminUrl = adminOrderUrl(req, order);
  await Promise.all([
    sendEmail(orderPlacedEmail(order, orderUrl)),
    sendEmail(ownerNewOrderEmail(order, adminUrl, env.email.owner)),
    sendOwnerAlert(newOrderAlert(order, adminUrl)),
  ]);
  res.status(201).json({ success: true, data: { order, key } });
};

// GET /api/orders/mine (signed in)
// Only orders placed while signed in; guest orders stay behind their private link
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
};

// GET /api/orders/:orderNumber?key=
export const getOrder = async (req, res) => {
  const order = await findCustomerOrder(req.params.orderNumber, req.query.key, req.user);
  res.json({ success: true, data: order });
};

// POST /api/orders/:orderNumber/payment?key= (multipart: reference, screenshot)
// The screenshot is required while image storage is set up. Without storage the
// reference alone is accepted, so a missing key never stops customers paying.
export const submitPayment = async (req, res) => {
  const order = await findCustomerOrder(req.params.orderNumber, req.query.key, req.user);

  if (order.status === 'cancelled') throw new ApiError(409, 'This order has been cancelled');
  if (order.status !== 'awaiting_payment') {
    throw new ApiError(409, 'Payment details for this order have already been sent');
  }
  const storageReady = isImageStorageReady();
  if (req.file && !storageReady) {
    throw new ApiError(503, 'Screenshot uploads are not available yet. Send the reference only.');
  }
  if (!req.file && storageReady) {
    throw new ApiError(400, 'Please attach a screenshot of your payment');
  }

  const screenshot = req.file ? await uploadImage(req.file.buffer, 'payments') : null;

  // Only moves on from awaiting_payment, in case the order expired a moment ago
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: 'awaiting_payment' },
    {
      $set: {
        status: 'payment_submitted',
        payment: { reference: req.body.reference, screenshot, submittedAt: new Date() },
      },
      $push: { history: { status: 'payment_submitted' } },
    },
    { returnDocument: 'after' }
  );

  if (!updated) {
    if (screenshot) await deleteImage(screenshot.publicId).catch(() => {});
    throw new ApiError(409, 'This order can no longer be paid. Please contact us.');
  }
  const adminUrl = adminOrderUrl(req, updated);
  await Promise.all([
    sendEmail(ownerPaymentSentEmail(updated, adminUrl, env.email.owner)),
    sendOwnerAlert(paymentSentAlert(updated, adminUrl)),
  ]);
  res.json({ success: true, data: updated });
};
