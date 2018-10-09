import Storage from '../src/Storage';

const _ = require('lodash');
const expect = require('unexpected');

describe('Storage.Buckets', () => {
  const storage = new Storage(process.env.KBC_URL, process.env.KBC_TOKEN);

  it('create', async () => {
    const bucketName = `bucket1-${_.random(1000, 20000)}`;
    const bucketId = `in.c-${bucketName}`;
    await expect(storage.request('get', `buckets/${bucketId}`), 'to be rejected');
    await expect(storage.Buckets.create('in', bucketName, { description: bucketName }), 'to be fulfilled');

    const res = await storage.request('get', `buckets/${bucketId}`);
    expect(res, 'to have key', 'description');
    expect(res.description, 'to be', bucketName);

    await storage.request('delete', `buckets/${bucketId}`);
  });

  it('get', async () => {
    const bucketName = `bucket2-${_.random(1000, 20000)}`;
    const bucketId = `in.c-${bucketName}`;
    await expect(storage.Buckets.get(bucketId), 'to be rejected');
    await storage.request('post', 'buckets', { stage: 'in', name: bucketName });

    const res = await expect(storage.Buckets.get(bucketId), 'to be fulfilled');
    expect(res, 'to have key', 'id');
    expect(res.id, 'to be', bucketId);
    expect(res, 'to have key', 'name');
    expect(res.name, 'to be', `c-${bucketName}`);

    await storage.request('delete', `buckets/${bucketId}`);
    await expect(storage.Buckets.get(bucketId), 'to be rejected');
  });

  it('list', async () => {
    const bucketName = `bucket4-${_.random(1000, 20000)}`;
    const bucketId = `in.c-${bucketName}`;
    const res = await expect(storage.Buckets.list(), 'to be fulfilled');
    expect(res, 'to be an', 'array');
    if (_.size(res) > 0) {
      expect(res, 'to have items satisfying', (item) => {
        expect(item, 'to have key', 'id');
        expect(item.id, 'no to be', bucketId);
      });
    }

    await storage.request('post', 'buckets', { stage: 'in', name: bucketName });
    const res2 = await expect(storage.Buckets.list(), 'to be fulfilled');
    expect(res2, 'to have an item satisfying', (item) => {
      expect(item, 'to have key', 'id');
      expect(item.id, 'to be', bucketId);
    });

    await storage.request('delete', `buckets/${bucketId}`);
  });

  it('delete', async () => {
    const bucketName = `bucket3-${_.random(1000, 20000)}`;
    const bucketId = `in.c-${bucketName}`;
    await expect(storage.Buckets.delete(bucketId), 'to be rejected');
    await storage.request('post', 'buckets', { stage: 'in', name: bucketName });
    await expect(storage.Buckets.delete(bucketId), 'to be fulfilled');
    await expect(() => storage.request('get', `buckets/${bucketId}`), 'to be rejected');
  });
});
