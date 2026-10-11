import { describe, expect, it } from 'vitest';
import { api, authHeader, createUser } from '../helpers.js';

const bank = {
  bankName: 'Meezan Bank',
  accountTitle: 'Store Owner',
  accountNumber: '0101-0123456',
};
const valid = {
  bankAccounts: [bank],
  shippingFee: 250,
  freeShippingThreshold: 5000,
  paymentWindowHours: 48,
};

describe('settings', () => {
  it('returns defaults with checkout closed before anything is saved', async () => {
    const res = await api().get('/api/settings');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      bankAccounts: [],
      shippingFee: 0,
      freeShippingThreshold: null,
      paymentWindowHours: 48,
      checkoutOpen: false,
    });
  });

  it('only lets admins change settings', async () => {
    const { token } = await createUser();
    const res = await api().put('/api/admin/settings').set(authHeader(token)).send(valid);
    expect(res.status).toBe(403);
  });

  it('saves settings and opens checkout once a bank account exists', async () => {
    const { token } = await createUser({ role: 'admin' });

    const saved = await api().put('/api/admin/settings').set(authHeader(token)).send(valid);
    const again = await api()
      .put('/api/admin/settings')
      .set(authHeader(token))
      .send({ ...valid, shippingFee: 300 });
    const read = await api().get('/api/settings');

    expect(saved.status).toBe(200);
    expect(again.body.data.shippingFee).toBe(300);
    expect(read.body.data).toMatchObject({ shippingFee: 300, checkoutOpen: true });
    expect(read.body.data.bankAccounts[0]).toMatchObject({ ...bank, iban: '' });
  });

  it('validates settings', async () => {
    const { token } = await createUser({ role: 'admin' });
    const send = (body) => api().put('/api/admin/settings').set(authHeader(token)).send(body);

    const missingAccount = await send({ ...valid, bankAccounts: [{ ...bank, accountNumber: '' }] });
    const badWindow = await send({ ...valid, paymentWindowHours: 0 });
    const negativeFee = await send({ ...valid, shippingFee: -1 });

    expect(missingAccount.status).toBe(400);
    expect(badWindow.status).toBe(400);
    expect(negativeFee.status).toBe(400);
  });
});
