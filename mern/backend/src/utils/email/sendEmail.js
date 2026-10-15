import nodemailer from 'nodemailer';
import env from '../../config/env.js';
import store from '../../config/store.js';

const RESEND_URL = 'https://api.resend.com/emails';
const TIMEOUT_MS = 8000;

// One Gmail connection setup, reused for every email (and across requests on a
// warm serverless instance)
let gmail;
const gmailTransport = () => {
  gmail ??= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.email.gmail.user, pass: env.email.gmail.appPassword },
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
  return gmail;
};

// Sent as the store's own Gmail address, which any inbox accepts
const viaGmail = async ({ to, subject, html, text }) => {
  try {
    await gmailTransport().sendMail({
      from: { name: store.name, address: env.email.gmail.user },
      to,
      replyTo: store.email,
      subject,
      html,
      text,
    });
  } catch (error) {
    if (error.code === 'EAUTH') {
      throw new Error('Gmail refused the login. Check GMAIL_USER and GMAIL_APP_PASSWORD.', {
        cause: error,
      });
    }
    throw error;
  }
};

const viaResend = async ({ to, subject, html, text }) => {
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
};

// Sends one email: through the store's Gmail when its App Password is set,
// otherwise through Resend. Email is a courtesy on top of what the site shows,
// so a failure never fails the request that caused it; the reason is logged
// instead. Callers await it because serverless hosts stop work left running
// after the response. Replies go to the store's inbox.
const sendEmail = async (message) => {
  if (!env.email.enabled || !message.to) return false;

  try {
    await (env.email.gmail?.appPassword ? viaGmail : viaResend)(message);
    return true;
  } catch (error) {
    console.error(`Email "${message.subject}" failed:`, error.message);
    return false;
  }
};

export default sendEmail;
