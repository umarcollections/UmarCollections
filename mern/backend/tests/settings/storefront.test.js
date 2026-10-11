import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteImage, isImageStorageReady, uploadImage } from '../../src/utils/imageStorage.js';
import { api, authHeader, createUser } from '../helpers.js';

vi.mock('../../src/utils/imageStorage.js', () => ({
  isImageStorageReady: vi.fn(),
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

const SETTINGS = {
  bankAccounts: [],
  shippingFee: 200,
  freeShippingThreshold: null,
  paymentWindowHours: 48,
};

const attachImage = (req) =>
  req.attach('image', Buffer.from('img'), { filename: 'a.jpg', contentType: 'image/jpeg' });

beforeEach(() => {
  let n = 0;
  isImageStorageReady.mockReset().mockReturnValue(true);
  uploadImage.mockReset().mockImplementation(async (buffer, folder) => {
    n += 1;
    return { url: `https://img.test/${folder}/${n}.jpg`, publicId: `${folder}/${n}` };
  });
  deleteImage.mockReset().mockResolvedValue({});
});

describe('home page settings', () => {
  it('saves hero text and announcement and shows them publicly', async () => {
    const { token } = await createUser({ role: 'admin' });

    const saved = await api()
      .put('/api/admin/settings')
      .set(authHeader(token))
      .send({ ...SETTINGS, heroHeading: 'Linen for summer', announcement: 'Closed on Eid day' });
    const tooLong = await api()
      .put('/api/admin/settings')
      .set(authHeader(token))
      .send({ ...SETTINGS, announcement: 'x'.repeat(121) });
    const read = await api().get('/api/settings');

    expect(saved.status).toBe(200);
    expect(tooLong.status).toBe(400);
    expect(read.body.data).toMatchObject({
      heroHeading: 'Linen for summer',
      heroText: '',
      heroImage: null,
      announcement: 'Closed on Eid day',
    });
  });

  it('replaces the hero photo, keeps it when text is saved, and removes it', async () => {
    const { token } = await createUser({ role: 'admin' });
    const upload = () =>
      attachImage(api().post('/api/admin/settings/hero-image').set(authHeader(token)));

    const first = await upload();
    const second = await upload();
    expect(first.body.data.heroImage).toEqual({ url: 'https://img.test/site/1.jpg' });
    expect(second.body.data.heroImage).toEqual({ url: 'https://img.test/site/2.jpg' });
    expect(deleteImage).toHaveBeenCalledWith('site/1');

    const textSaved = await api().put('/api/admin/settings').set(authHeader(token)).send(SETTINGS);
    expect(textSaved.body.data.heroImage).toEqual({ url: 'https://img.test/site/2.jpg' });

    const removed = await api().delete('/api/admin/settings/hero-image').set(authHeader(token));
    expect(removed.body.data.heroImage).toBeNull();
    expect(deleteImage).toHaveBeenCalledWith('site/2');
  });

  it('refuses uploads until image storage is set up, and from customers', async () => {
    const { token } = await createUser({ role: 'admin' });
    const { token: customer } = await createUser();
    isImageStorageReady.mockReturnValue(false);

    const off = await attachImage(
      api().post('/api/admin/settings/hero-image').set(authHeader(token))
    );
    const forbidden = await attachImage(
      api().post('/api/admin/settings/hero-image').set(authHeader(customer))
    );

    expect(off.status).toBe(503);
    expect(forbidden.status).toBe(403);
    expect(uploadImage).not.toHaveBeenCalled();
  });
});

describe('category photos', () => {
  const setup = async () => {
    const { token } = await createUser({ role: 'admin' });
    const category = (
      await api().post('/api/admin/categories').set(authHeader(token)).send({ name: 'Bags' })
    ).body.data;
    const url = `/api/admin/categories/${category._id}/image`;
    return { token, category, url };
  };

  it('sets, replaces and removes a category photo', async () => {
    const { token, url } = await setup();

    await attachImage(api().post(url).set(authHeader(token)));
    const replaced = await attachImage(api().post(url).set(authHeader(token)));
    const listed = await api().get('/api/categories');
    const removed = await api().delete(url).set(authHeader(token));

    expect(replaced.body.data.image.url).toBe('https://img.test/categories/2.jpg');
    expect(deleteImage).toHaveBeenCalledWith('categories/1');
    expect(listed.body.data[0].image.url).toBe('https://img.test/categories/2.jpg');
    expect(removed.body.data.image).toBeNull();
  });

  it('needs a file and a real category', async () => {
    const { token, url } = await setup();

    const noFile = await api().post(url).set(authHeader(token));
    const unknown = await attachImage(
      api().post('/api/admin/categories/000000000000000000000000/image').set(authHeader(token))
    );

    expect(noFile.status).toBe(400);
    expect(unknown.status).toBe(404);
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('deletes the photo along with the category', async () => {
    const { token, category, url } = await setup();
    await attachImage(api().post(url).set(authHeader(token)));

    await api().delete(`/api/admin/categories/${category._id}`).set(authHeader(token));
    expect(deleteImage).toHaveBeenCalledWith('categories/1');
  });
});
