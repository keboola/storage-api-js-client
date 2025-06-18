import expect from 'unexpected';
import Storage from '../src/Storage';

describe('Storage', () => {
  const storage = new Storage(process.env.KBC_URL, process.env.KBC_TOKEN);
  it('request', () => storage.request('get', 'tokens/verify')
    .then((res) => {
      expect(res, 'to have key', 'id');
      expect(res, 'to have key', 'owner');
    }));

  it('verifyToken', () => storage.verifyToken()
    .then((res) => {
      expect(res, 'to have key', 'id');
      expect(res, 'to have key', 'owner');
    }));

  it('verifyTokenAdmin', () => storage.verifyTokenAdmin()
    .then((res) => {
      expect(res, 'to have key', 'id');
      expect(res, 'to have key', 'owner');
    }));

  it('generateId', async () => {
    const res = await expect(storage.generateId(), 'to be fulfilled');
    expect(res, 'to be a', 'number');
    expect(res, 'to be positive');
  });

  it('index', async () => {
    const res = await expect(storage.index(), 'to be fulfilled');
    expect(res, 'to have key', 'components');
  });
});
