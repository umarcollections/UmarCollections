import { button, escapeHtml, layout, paragraph, textFooter } from './layout.js';

export const passwordResetEmail = (user, resetUrl) => ({
  to: user.email,
  subject: 'Reset your password',
  html: layout({
    preheader: 'The link works for 1 hour.',
    heading: 'Reset your password',
    body:
      paragraph(
        `Hi ${escapeHtml(user.name.split(' ')[0])}, use the button below to choose a new password.`
      ) +
      button(resetUrl, 'Choose a new password') +
      paragraph(
        "The link works for 1 hour and only once. If you didn't ask for it, you can ignore this email; your password stays the same."
      ),
  }),
  text: `Reset your password\n\nHi ${user.name.split(' ')[0]}, open this link to choose a new password:\n${resetUrl}\n\nThe link works for 1 hour and only once. If you didn't ask for it, you can ignore this email.${textFooter}`,
});
