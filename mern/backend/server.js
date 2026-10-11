import env from './src/config/env.js';
import app from './src/app.js';
import startup from './src/config/startup.js';
import { scheduleUnpaidOrderCleanup } from './src/utils/orders/cancelUnpaidOrders.js';

const start = async () => {
  await startup();
  scheduleUnpaidOrderCleanup();
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
};

start();
