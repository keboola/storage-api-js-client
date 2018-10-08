import Storage from '../src/Storage';

const _ = require('lodash');
const expect = require('unexpected');

describe('Storage.Buckets', () => {
  const storage = new Storage(process.env.KBC_URL, process.env.KBC_TOKEN);

  const bucketName1 = `bucket1-${_.random(1000, 20000)}`;
  const bucketId1 = `in.c-${bucketName1}`;
  it('create', () => expect(() => storage.request('get', `buckets/${bucketId1}`), 'to be rejected')
    .then(() => expect(() => storage.Buckets.create('in', bucketName1, { description: bucketName1 }), 'to be fulfilled'))
    .then(() => storage.request('get', `buckets/${bucketId1}`))
    .then((res) => {
      expect(res, 'to have key', 'description');
      expect(res.description, 'to be', bucketName1);
    })
    .then(() => storage.request('delete', `buckets/${bucketId1}`)));

  const bucketName2 = `bucket2-${_.random(1000, 20000)}`;
  const bucketId2 = `in.c-${bucketName2}`;
  it('get', () => expect(() => storage.Buckets.get(bucketId2), 'to be rejected')
    .then(() => storage.request('post', 'buckets', { stage: 'in', name: bucketName2 }))
    .then(() => storage.Buckets.get(bucketId2))
    .then((res) => {
      expect(res, 'to have key', 'id');
      expect(res.id, 'to be', bucketId2);
      expect(res, 'to have key', 'name');
      expect(res.name, 'to be', `c-${bucketName2}`);
    })
    .then(() => storage.request('delete', `buckets/${bucketId2}`))
    .then(() => expect(() => storage.Buckets.get(bucketId2), 'to be rejected')));

  const bucketName3 = `bucket3-${_.random(1000, 20000)}`;
  const bucketId3 = `in.c-${bucketName3}`;
  it('delete', () => expect(() => storage.Buckets.delete(bucketId3), 'to be rejected')
    .then(() => storage.request('post', 'buckets', { stage: 'in', name: bucketName3 }))
    .then(() => expect(() => storage.Buckets.delete(bucketId3), 'to be fulfilled'))
    .then(() => expect(() => storage.request('get', `buckets/${bucketId3}`), 'to be rejected')));
});
