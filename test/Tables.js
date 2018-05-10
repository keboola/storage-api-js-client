import Storage from '../src/Storage';

const _ = require('lodash');
const aws = require('aws-sdk');
const fs = require('fs');
const Promise = require('bluebird');
const expect = require('unexpected');

aws.config.setPromisesDependency(Promise);

describe('Storage.Tables', () => {
  const storage = new Storage(process.env.KBC_URL, process.env.KBC_TOKEN);

  const bucketName1 = `bucket1-${_.random(1000, 2000)}`;
  const bucketId1 = `in.c-${bucketName1}`;
  it('create', () =>
    storage.request('post', 'buckets', { stage: 'in', name: bucketName1 })
      .then(() => storage.Tables.create(bucketId1, 'table', `${__dirname}/sample.csv`, { primaryKey: 'id' }))
      .then((res) => {
        expect(res, 'to have key', 'results');
        expect(res.results, 'to have key', 'id');
        expect(res.results.id, 'to be', `${bucketId1}.table`);
        expect(res.results, 'to have key', 'primaryKey');
        expect(res.results.primaryKey, 'to equal', ['id']);
        expect(res.results, 'to have key', 'columns');
        expect(res.results.columns, 'to equal', ['id', 'name', 'price', 'date', 'info', 'category']);
        expect(res.results, 'to have key', 'rowsCount');
        expect(res.results.rowsCount, 'to be', 5);
      })
      .then(() => storage.request('delete', `buckets/${bucketId1}?force=1`)));

  const bucketName2 = `bucket2-${_.random(1000, 2000)}`;
  const bucketId2 = `in.c-${bucketName2}`;
  const tableId2 = `${bucketId2}.table`;
  it('get', () =>
    storage.request('post', 'buckets', { stage: 'in', name: bucketName2 })
      .then(() => storage.Files.prepare(tableId2, { federationToken: 1 }))
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
      .then(res => storage.request('post', `buckets/${bucketId2}/tables-async`, {
        name: 'table',
        dataFileId: res,
      }))
      .then(res => storage.Jobs.wait(res.id))
      .then(() => storage.Tables.get(tableId2))
      .then((res) => {
        expect(res, 'to have key', 'id');
        expect(res.id, 'to be', `${bucketId2}.table`);
        expect(res, 'to have key', 'columns');
        expect(res.columns, 'to equal', ['id', 'name', 'price', 'date', 'info', 'category']);
        expect(res, 'to have key', 'rowsCount');
        expect(res.rowsCount, 'to be', 5);
      })
      .then(() => storage.request('delete', `buckets/${bucketId2}?force=1`)));
});
