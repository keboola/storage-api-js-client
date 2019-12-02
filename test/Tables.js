import Storage from '../src/Storage';

const _ = require('lodash');
const aws = require('aws-sdk');
const fs = require('fs');
const expect = require('unexpected');

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
    .then((res) => storage.request('post', `buckets/${bucket}/tables-async`, {
      name: table,
      dataFileId: res,
    }))
    .then((res) => storage.Jobs.wait(res.id));
}

describe('Storage.Tables', () => {
  const storage = new Storage(process.env.KBC_URL, process.env.KBC_TOKEN);

  let bucketName;
  let bucketId;
  let tableName;
  let tableId;
  beforeEach(() => {
    bucketName = `bucket-${_.random(1000, 20000)}`;
    bucketId = `in.c-${bucketName}`;
    tableName = `table-${_.random(1000, 20000)}`;
    tableId = `${bucketId}.${tableName}`;
    return storage.request('post', 'buckets', { stage: 'in', name: bucketName });
  });

  afterEach(() => storage.request('delete', `buckets/${bucketId}?force=1`));

  it('create', async () => {
    const res = await storage.Tables.create(bucketId, 'table', `${__dirname}/sample.csv`, { primaryKey: 'id' });
    expect(res, 'to have key', 'results');
    expect(res.results, 'to have key', 'id');
    expect(res.results.id, 'to be', `${bucketId}.table`);
    expect(res.results, 'to have key', 'primaryKey');
    expect(res.results.primaryKey, 'to equal', ['id']);
    expect(res.results, 'to have key', 'columns');
    expect(res.results.columns, 'to equal', ['id', 'name', 'price', 'date', 'info', 'category']);
    expect(res.results, 'to have key', 'rowsCount');
    expect(res.results.rowsCount, 'to be', 5);
  });

  it('import incremental', async () => {
    await storage.Tables.create(bucketId, 'table', `${__dirname}/sample.csv`, {});
    const res = await storage.Tables.import(`${bucketId}.table`, `${__dirname}/sample.csv`, { incremental: true });
    expect(res, 'to have key', 'results');
    expect(res.results, 'to have key', 'importedColumns');
    expect(res.results.importedColumns, 'to equal', ['id', 'name', 'price', 'date', 'info', 'category']);
    expect(res.results, 'to have key', 'totalRowsCount');
    expect(res.results.totalRowsCount, 'to be', 10);
  });

  it('import', async () => {
    await storage.Tables.create(bucketId, 'table', `${__dirname}/sample.csv`, {});
    const res = await storage.Tables.import(`${bucketId}.table`, `${__dirname}/sample.csv`, { incremental: false });
    expect(res, 'to have key', 'results');
    expect(res.results, 'to have key', 'importedColumns');
    expect(res.results.importedColumns, 'to equal', ['id', 'name', 'price', 'date', 'info', 'category']);
    expect(res.results, 'to have key', 'totalRowsCount');
    expect(res.results.totalRowsCount, 'to be', 10);
  });

  it('list', async () => {
    await createTestTable(storage, bucketId, tableName);
    let res = await storage.Tables.list(bucketId);
    expect(res, 'to have length', 1);
    expect(res[0], 'to have key', 'id');
    expect(res[0].id, 'to be', tableId);
    expect(res[0], 'not to have key', 'columns');

    res = await storage.Tables.list(bucketId, ['columns']);
    expect(res, 'to have length', 1);
    expect(res[0], 'to have key', 'id');
    expect(res[0].id, 'to be', tableId);
    expect(res[0], 'to have key', 'columns');
  });

  it('get', async () => {
    await createTestTable(storage, bucketId, tableName);
    const res = await storage.Tables.get(tableId);
    expect(res, 'to have key', 'id');
    expect(res.id, 'to be', tableId);
    expect(res, 'to have key', 'columns');
    expect(res.columns, 'to equal', ['id', 'name', 'price', 'date', 'info', 'category']);
    expect(res, 'to have key', 'rowsCount');
    expect(res.rowsCount, 'to be', 5);
  });

  it('preview', async () => {
    await createTestTable(storage, bucketId, tableName);
    await expect(storage.request('get', `tables/${tableId}`), 'to be fulfilled');
    const res = await storage.Tables.preview(tableId, { columns: 'id,name' });
    expect(res, 'to be a', 'array');
    expect(_.keys(res), 'to have length', 5);
    expect(res[0], 'to have key', 'id');
    expect(res[0], 'to have key', 'name');
    expect(res[0], 'not to have key', 'price');
  });

  it('export', async () => {
    await createTestTable(storage, bucketId, tableName);
    await expect(storage.request('get', `tables/${tableId}`), 'to be fulfilled');
    const res = await storage.Tables.export(tableId);
    expect(res, 'to be a', 'array');
    expect(res, 'to have length', 5);
    expect(res[0], 'to be a', 'array');
    expect(res[0], 'to have length', 6);
  });

  it('delete', async () => {
    await createTestTable(storage, bucketId, tableName);
    await expect(storage.request('get', `tables/${tableId}`), 'to be fulfilled');
    await expect(storage.Tables.delete(tableId), 'to be fulfilled');
    await expect(storage.request('get', `tables/${tableId}`), 'to be rejected');
  });
});
