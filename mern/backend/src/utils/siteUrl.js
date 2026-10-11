import env from '../config/env.js';

// The store's public address with no trailing slash: SITE_URL (or Vercel's
// production domain) when set, otherwise the address this request came in on
const siteUrl = (req) => env.siteUrl || `${req.protocol}://${req.get('host')}`;

export default siteUrl;
