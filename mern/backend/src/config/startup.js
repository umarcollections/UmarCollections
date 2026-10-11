import connectDB from './db.js';
import seedAdmin from '../utils/auth/seedAdmin.js';

let starting;

// Connects to MongoDB and syncs the owner's admin account, once per process.
// server.js calls it at boot; on Vercel every request awaits it, and only the
// first request on a fresh instance does the work.
const startup = () => {
  starting ??= (async () => {
    await connectDB();
    await seedAdmin();
  })().catch((error) => {
    // Let the next request try again instead of failing forever
    starting = undefined;
    throw error;
  });
  return starting;
};

export default startup;
