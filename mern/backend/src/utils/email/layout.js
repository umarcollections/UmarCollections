import store, { whatsappLink } from '../../config/store.js';

// Shared pieces for every email. Email apps ignore stylesheets and web fonts,
// so styles are inline, layout uses tables, and fonts fall back to Georgia and Arial.

export const COLORS = {
  page: '#f3e5d0',
  card: '#fffbf5',
  text: '#2e2018',
  muted: '#6b4a35',
  accent: '#9a4a1c',
  line: '#e6c9a3',
};
const SERIF = "Georgia, 'Times New Roman', serif";
export const SANS = 'Arial, Helvetica, sans-serif';

export const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );

export const rupees = (amount) => `Rs ${amount.toLocaleString('en-PK')}`;

// Dates in emails are always Pakistan time, whatever the server's clock zone is
export const pakistanTime = (date) =>
  new Date(date).toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const paragraph = (html) =>
  `<p style="margin:0 0 16px;font:15px/1.6 ${SANS};color:${COLORS.text}">${html}</p>`;

export const button = (href, label) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${COLORS.text}"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font:bold 13px ${SANS};letter-spacing:2px;text-transform:uppercase;color:${COLORS.card};text-decoration:none">${escapeHtml(label)}</a></td></tr></table>`;

export const sectionTitle = (text) =>
  `<p style="margin:24px 0 8px;font:bold 11px ${SANS};letter-spacing:2px;text-transform:uppercase;color:${COLORS.accent}">${escapeHtml(text)}</p>`;

// Label/value rows, e.g. bank details or totals. Values are escaped here.
export const rows = (pairs, { boldLast = false } = {}) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font:14px/1.5 ${SANS};color:${COLORS.text}">${pairs
    .map(([label, value], i) => {
      const weight = boldLast && i === pairs.length - 1 ? 'bold' : 'normal';
      return `<tr><td style="padding:4px 0;color:${COLORS.muted};font-weight:${weight}">${escapeHtml(label)}</td><td style="padding:4px 0;text-align:right;font-weight:${weight}">${escapeHtml(value)}</td></tr>`;
    })
    .join('')}</table>`;

export const box = (html) =>
  `<div style="margin:0 0 16px;padding:16px 20px;border:1px solid ${COLORS.line};border-radius:16px;background:#ffffff">${html}</div>`;

// The whole email. preheader is the preview line inboxes show after the subject.
export const layout = ({ preheader, heading, body }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.page}">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td align="center" style="padding:0 0 24px;font:600 20px ${SERIF};letter-spacing:5px;text-transform:uppercase;color:${COLORS.text}">Umar <span style="color:#cf6a24">Collections</span></td></tr>
<tr><td style="padding:32px 28px;border-radius:24px;background:${COLORS.card}">
<h1 style="margin:0 0 20px;font:normal 30px/1.2 ${SERIF};color:${COLORS.text}">${escapeHtml(heading)}</h1>
${body}
</td></tr>
<tr><td align="center" style="padding:24px 12px;font:12px/1.6 ${SANS};color:${COLORS.muted}">
Questions? Reply to this email, or WhatsApp us at <a href="${whatsappLink}" style="color:${COLORS.muted}">${escapeHtml(store.phone)}</a>.<br>${escapeHtml(store.name)}, ${escapeHtml(store.address)}
</td></tr>
</table></td></tr></table>
</body></html>`;

// The plain-text copy for email apps that don't show HTML
export const textFooter = `\n\nQuestions? Reply to this email, or WhatsApp us at ${store.phone}.\n${store.name}, ${store.address}`;
