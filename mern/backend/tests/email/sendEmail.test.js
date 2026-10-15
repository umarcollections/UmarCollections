import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import nodemailer from 'nodemailer';
import env from '../../src/config/env.js';
import sendEmail from '../../src/utils/email/sendEmail.js';

const sendMail = vi.fn();
vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn(() => ({ sendMail })) } }));

const fetchMock = vi.fn();
const savedEmail = env.email;
const MESSAGE = { to: 'ayesha@example.com', subject: 'Order 1004', html: '<p>Hi</p>', text: 'Hi' };

const useGmail = () => {
  env.email = {
    ...savedEmail,
    gmail: { user: 'umarcollections.store@gmail.com', appPassword: 'abcdabcdabcdabcd' },
    apiKey: 're_test',
    enabled: true,
  };
};

beforeEach(() => {
  sendMail.mockReset().mockResolvedValue({ messageId: '1' });
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  env.email = savedEmail;
  vi.unstubAllGlobals();
});

describe('sendEmail', () => {
  it("uses the store's Gmail when its App Password is set, even with a Resend key", async () => {
    useGmail();
    expect(await sendEmail(MESSAGE)).toBe(true);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        service: 'gmail',
        auth: { user: 'umarcollections.store@gmail.com', pass: 'abcdabcdabcdabcd' },
      })
    );
    expect(sendMail).toHaveBeenCalledWith({
      from: { name: 'Umar Collections', address: 'umarcollections.store@gmail.com' },
      to: 'ayesha@example.com',
      replyTo: 'umarcollections.store@gmail.com',
      subject: 'Order 1004',
      html: '<p>Hi</p>',
      text: 'Hi',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses Resend when there is no Gmail App Password', async () => {
    env.email = {
      ...savedEmail,
      gmail: { user: 'x', appPassword: undefined },
      apiKey: 're_test',
      enabled: true,
    };
    expect(await sendEmail(MESSAGE)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.any(Object));
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('explains a refused Gmail login, without failing the caller', async () => {
    useGmail();
    sendMail.mockRejectedValue(Object.assign(new Error('Invalid login: 535'), { code: 'EAUTH' }));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await sendEmail(MESSAGE)).toBe(false);
    expect(error).toHaveBeenCalledWith(
      'Email "Order 1004" failed:',
      'Gmail refused the login. Check GMAIL_USER and GMAIL_APP_PASSWORD.'
    );
    error.mockRestore();
  });

  it('sends nothing when no provider is set up', async () => {
    env.email = { ...savedEmail, enabled: false };
    expect(await sendEmail(MESSAGE)).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
