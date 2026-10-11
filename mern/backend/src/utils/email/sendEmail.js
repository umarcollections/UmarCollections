import env from '../../config/env.js';
import store from '../../config/store.js';

const RESEND_URL = 'https://api.resend.com/emails';
const TIMEOUT_MS = 8000;

// Sends one email through Resend's API. Email is a courtesy on top of what the
// site shows, so a failure never fails the request that caused it; the reason
// is logged instead. Callers await it because serverless hosts stop work left
// running after the response. Replies go to the store's inbox.
const sendEmail = async ({ to, subject, html, text }) => {
  if (!env.email.enabled || !to) return false;

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.email.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.email.from,
        to: [to],
        reply_to: store.email,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Resend answered ${res.status}${body.message ? `: ${body.message}` : ''}`);
    }
    return true;
  } catch (error) {
    console.error(`Email "${subject}" failed:`, error.message);
    return false;
  }
};

export default sendEmail;
