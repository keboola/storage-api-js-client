import Storage from '../src/Storage';

const _ = require('lodash');
const aws = require('aws-sdk');
const fs = require('fs');
const Promise = require('bluebird');
const expect = require('unexpected');

aws.config.setPromisesDependency(Promise);

function createTestTable(storage, bucket, table) {
  return storage.Files.prepare(`${bucket}.${table}`, { federationToken: 1 })
    .then((file) => {
      const s3 = new aws.S3({
        accessKeyId: file.uploadParams.credentials.AccessKeyId,
        secretAccessKey: file.uploadParams.credentials.SecretAccessKey,
        sessionToken: file.uploadParams.credentials.SessionToken,
      });
      return s3.putObject({
        Bucket: file.uploadParams.bucket,
        Key: file.uploadParams.key,
        Body: fs.readFileSync(`${__dirname}/sample.csv`),
      }).promise()
        .then(() => file.id);
    })
    .then(res => storage.request('post', `buckets/${bucket}/tables-async`, {
      name: table,
      dataFileId: res,
    }))
    .then(res => storage.Jobs.wait(res.id));
}

describe('Storage.Tables', () => {
  const storage = new Storage(process.env.KBC_URL, process.env.KBC_TOKEN);

  let bucketName;
  let bucketId;
  let tableName;
  let tableId;
  beforeEach(() => {
    bucketName = `bucket-${_.random(1000, 2000)}`;
    bucketId = `in.c-${bucketName}`;
    tableName = `table-${_.random(1000, 2000)}`;
    tableId = `${bucketId}.${tableName}`;
    return storage.request('post', 'buckets', { stage: 'in', name: bucketName });
  });

  afterEach(() => storage.request('delete', `buckets/${bucketId}?force=1`));

  it('create', () =>
    storage.Tables.create(bucketId, 'table', `${__dirname}/sample.csv`, { primaryKey: 'id' })
      .then((res) => {
        expect(res, 'to have key', 'results');
        expect(res.results, 'to have key', 'id');
        expect(res.results.id, 'to be', `${bucketId}.table`);
        expect(res.results, 'to have key', 'primaryKey');
        expect(res.results.primaryKey, 'to equal', ['id']);
        expect(res.results, 'to have key', 'columns');
        expect(res.results.columns, 'to equal', ['id', 'name', 'price', 'date', 'info', 'category']);
        expect(res.results, 'to have key', 'rowsCount');
        expect(res.results.rowsCount, 'to be', 5);
      }));

  it('get', () =>
    createTestTable(storage, bucketId, tableName)
      .then(() => storage.Tables.get(tableId))
      .then((res) => {
        expect(res, 'to have key', 'id');
        expect(res.id, 'to be', tableId);
        expect(res, 'to have key', 'columns');
        expect(res.columns, 'to equal', ['id', 'name', 'price', 'date', 'info', 'category']);
        expect(res, 'to have key', 'rowsCount');
        expect(res.rowsCount, 'to be', 5);
      }));

  it('export', () =>
    createTestTable(storage, bucketId, tableName)
      .then(() => expect(() => storage.request('get', `tables/${tableId}`), 'to be fulfilled'))
      .then(() => storage.Tables.export(tableId))
      .then((res) => {
        expect(res, 'to be a', 'array');
        expect(res, 'to have length', 5);
        expect(res[0], 'to be a', 'array');
        expect(res[0], 'to have length', 6);
      }));

  it('delete', () =>
    createTestTable(storage, bucketId, tableName)
      .then(() => expect(() => storage.request('get', `tables/${tableId}`), 'to be fulfilled'))
      .then(() => storage.Tables.delete(tableId))
      .then(() => expect(() => storage.request('get', `tables/${tableId}`), 'to be rejected')));
});
