import app from '../backend/src/app.js';
import startup from '../backend/src/config/startup.js';
import { cancelUnpaidOrdersIfDue } from '../backend/src/utils/orders/cancelUnpaidOrders.js';

// Vercel runs the Express API as this one function (vercel.json sends /api/*,
// /sitemap.xml and /robots.txt here). Locally, backend/server.js runs it instead.
// There is no always-on server, so overdue unpaid orders are cancelled while
// handling requests rather than on a timer.
const handler = async (req, res) => {
  await startup();
  await cancelUnpaidOrdersIfDue();
  return app(req, res);
};

export default handler;
