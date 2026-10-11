import env from './src/config/env.js';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import seedAdmin from './src/utils/auth/seedAdmin.js';
import { scheduleUnpaidOrderCleanup } from './src/utils/orders/cancelUnpaidOrders.js';

const start = async () => {
  await connectDB();
  await seedAdmin();
  scheduleUnpaidOrderCleanup();
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
};

start();
