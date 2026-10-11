import Order from '../../models/order.model.js';
import releaseOrderHolds from './releaseOrderHolds.js';
import { orderCancelledEmail } from '../email/orderEmails.js';
import sendEmail from '../email/sendEmail.js';

const CHECK_EVERY_MS = 10 * 60 * 1000;

// Cancels orders whose payment window has passed and puts their stock (and
// discount code use) back.
// Orders with a submitted payment are left for the admin to check.
export const cancelUnpaidOrders = async (now = new Date()) => {
  const due = await Order.find({ status: 'awaiting_payment', paymentDueAt: { $lte: now } }).select(
    '_id'
  );

  let cancelled = 0;
  for (const { _id } of due) {
    // Matching on the status again means stock is released once, even if the
    // customer submits payment at the same moment
    const order = await Order.findOneAndUpdate(
      { _id, status: 'awaiting_payment' },
      {
        $set: { status: 'cancelled' },
        $push: { history: { status: 'cancelled', note: 'Payment not received in time', at: now } },
      },
      { returnDocument: 'after' }
    );
    if (order) {
      await releaseOrderHolds(order);
      await sendEmail(orderCancelledEmail(order, { expired: true }));
      cancelled += 1;
    }
  }
  return cancelled;
};

// For hosts without an always-on server (Vercel): called on incoming requests,
// it runs the check at most once every 10 minutes per instance
let lastRun = 0;
export const cancelUnpaidOrdersIfDue = async () => {
  if (Date.now() - lastRun < CHECK_EVERY_MS) return;
  lastRun = Date.now();
  await cancelUnpaidOrders().catch((error) =>
    console.error('Cancelling unpaid orders failed:', error)
  );
};

// Runs the check now and every 10 minutes while the server is up
export const scheduleUnpaidOrderCleanup = () => {
  const run = () =>
    cancelUnpaidOrders().catch((error) => console.error('Cancelling unpaid orders failed:', error));
  run();
  return setInterval(run, CHECK_EVERY_MS);
};
