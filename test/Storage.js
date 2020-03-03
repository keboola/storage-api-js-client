import expect from 'unexpected';
import Storage from '../src/Storage';

describe('Storage', () => {
  const storage = new Storage(process.env.KBC_URL, process.env.KBC_TOKEN);
  it('request', () => storage.request('get', 'tokens/verify')
    .then((res) => {
      expect(res, 'to have key', 'id');
      expect(res, 'to have key', 'token');
      expect(res, 'to have key', 'owner');
      expect(res.token, 'to be', process.env.KBC_TOKEN);
    }));

  it('verifyToken', () => storage.verifyToken()
    .then((res) => {
      expect(res, 'to have key', 'id');
      expect(res, 'to have key', 'token');
      expect(res, 'to have key', 'owner');
      expect(res.token, 'to be', process.env.KBC_TOKEN);
    }));

  it('verifyTokenAdmin', () => storage.verifyTokenAdmin()
    .then((res) => {
      expect(res, 'to have key', 'id');
      expect(res, 'to have key', 'token');
      expect(res, 'to have key', 'owner');
      expect(res.token, 'to be', process.env.KBC_TOKEN);
    }));

  it('generateId', async () => {
    const res = await expect(storage.generateId(), 'to be fulfilled');
    expect(res, 'to be a', 'number');
    expect(res, 'to be positive');
  });
});
