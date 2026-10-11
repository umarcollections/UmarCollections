import Order from '../../models/order.model.js';
import { getSettings } from '../../models/settings.model.js';
import ApiError from '../../utils/ApiError.js';
import { deleteImage } from '../../utils/imageStorage.js';
import releaseOrderHolds from '../../utils/orders/releaseOrderHolds.js';
import { escapeRegex, paginate } from '../../utils/query.js';
import { adminOrderListQuerySchema } from '../../validators/orders/adminOrder.schema.js';

// All routes here are admin only (see routes/orders/adminOrder.routes.js)

const HOUR_MS = 60 * 60 * 1000;

// Which statuses each action may start from. Anything shipped or later can't be
// cancelled here, because the goods have left and the stock can't simply return.
const ALLOWED_FROM = {
  confirm_payment: ['awaiting_payment', 'payment_submitted'],
  reject_payment: ['payment_submitted'],
  ship: ['confirmed'],
  deliver: ['shipped'],
  cancel: ['awaiting_payment', 'payment_submitted', 'confirmed'],
};

const STATUS_LABELS = {
  awaiting_payment: 'awaiting payment',
  payment_submitted: 'payment submitted',
  confirmed: 'confirmed',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

// The status, fields and history entry each action writes
const buildChange = async (body, now) => {
  switch (body.action) {
    case 'confirm_payment':
      return {
        status: 'confirmed',
        set: { 'payment.confirmedAt': now },
        note: 'Payment confirmed',
      };
    case 'reject_payment': {
      // The customer gets a fresh payment window to send the right details
      const { paymentWindowHours } = await getSettings();
      return {
        status: 'awaiting_payment',
        set: {
          payment: { rejectionNote: body.note },
          paymentDueAt: new Date(now.getTime() + paymentWindowHours * HOUR_MS),
        },
        note: `Payment rejected: ${body.note}`,
      };
    }
    case 'ship': {
      const details = [body.courier, body.trackingNumber].filter(Boolean).join(', ');
      return {
        status: 'shipped',
        set: {
          shipment: { courier: body.courier, trackingNumber: body.trackingNumber, shippedAt: now },
        },
        note: details ? `Shipped: ${details}` : 'Shipped',
      };
    }
    case 'deliver':
      return { status: 'delivered', set: {}, note: 'Delivered' };
    case 'cancel':
      return { status: 'cancelled', set: {}, note: body.note || 'Cancelled by the store' };
  }
};

const searchFilter = (q) => {
  const pattern = { $regex: escapeRegex(q), $options: 'i' };
  const filter = [
    { 'customer.name': pattern },
    { 'customer.email': pattern },
    { 'customer.phone': pattern },
  ];
  if (/^\d+$/.test(q)) filter.push({ orderNumber: Number(q) });
  return { $or: filter };
};

// GET /api/admin/orders?q=&status=&page=&limit=
// q matches the order number, or the customer's name, email or phone
export const getOrders = async (req, res) => {
  const { q, status, page, limit } = adminOrderListQuerySchema.parse(req.query);
  const filter = {
    ...(q && searchFilter(q)),
    ...(status && { status }),
  };

  const { items, pagination } = await paginate(Order, filter, {
    page,
    limit,
    sort: { createdAt: -1, _id: -1 },
  });
  res.json({ success: true, data: items, pagination });
};

// GET /api/admin/orders/:id
export const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, data: order });
};

// POST /api/admin/orders/:id/actions  { action, ...details }
export const applyOrderAction = async (req, res) => {
  const now = new Date();
  const change = await buildChange(req.body, now);

  // Matching on the allowed statuses makes the change atomic: a second click,
  // another admin, or the expiry job can't apply something twice
  const before = await Order.findOneAndUpdate(
    { _id: req.params.id, status: { $in: ALLOWED_FROM[req.body.action] } },
    {
      $set: { status: change.status, ...change.set },
      $push: { history: { status: change.status, note: change.note, at: now } },
    },
    { returnDocument: 'before' }
  );

  if (!before) {
    const current = await Order.findById(req.params.id);
    if (!current) throw new ApiError(404, 'Order not found');
    throw new ApiError(
      409,
      `This order is ${STATUS_LABELS[current.status]}, so that can't be done now`
    );
  }

  if (req.body.action === 'cancel') await releaseOrderHolds(before);
  if (req.body.action === 'reject_payment' && before.payment?.screenshot?.publicId) {
    // Best effort: a leftover file on Cloudinary must not fail the request
    await deleteImage(before.payment.screenshot.publicId).catch(() => {});
  }

  res.json({ success: true, data: await Order.findById(before._id) });
};
