/* eslint-disable @typescript-eslint/explicit-function-return-type */
import aws from 'aws-sdk';

import fs from 'fs';
import _ from 'lodash';
import os from 'os';
import stream from 'stream';
import expect from 'unexpected';
import util from 'util';
import Storage from '../src/Storage';

// es6 import of fast-csv fails on CI, who knows why
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csv = require('fast-csv');

const streamFinished = util.promisify(stream.finished);

class FileStream {
  constructor(filename) {
    this.file = fs.createWriteStream(filename, { flags: 'a' });
  }

  async writeRow(row) {
    await new Promise((res, rej) => {
      this.file.write(`${row}\n`, (err) => {
        if (err) {
          rej(err);
        }
        res();
      });
    });
  }

  async close() {
    this.file.end();
    await streamFinished(this.file);
  }

  static delete(filename) {
    fs.unlinkSync(filename);
  }
}

function createTestTable(storage, bucket, table, customFile = null) {
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
        Body: customFile ? fs.createReadStream(customFile) : fs.readFileSync(`${__dirname}/sample.csv`),
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

  afterEach(() => {
    storage.request('delete', `buckets/${bucketId}?force=1&async=1`)
      .then((res) => storage.Jobs.wait(res.id));
  });

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

  it('exportToFile', async () => {
    const tempFilePath = `${os.tmpdir()}/storage-test-${Date.now()}-${_.random(1000, 9999)}`;
    const inFilePath = `${tempFilePath}.in`;

    // Create a bigger file to enforce and check proper slicing during download from S3
    const f = new FileStream(inFilePath);
    await f.writeRow('"id","name","price","date","info","category"');
    const longString = 'a'.repeat(10000);
    for (let i = 1; i <= 50000; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await f.writeRow(`"r${i}","Product ${i}","${i}","2016-04-02 12:00:12","${longString}","c2"`);
    }
    await f.close();

    await createTestTable(storage, bucketId, tableName, inFilePath);
    await expect(storage.request('get', `tables/${tableId}`), 'to be fulfilled');

    const outFilePath = `${tempFilePath}.out`;
    await storage.Tables.exportToFile(tableId, {}, outFilePath);
    expect(fs.existsSync(outFilePath), 'to be ok');

    // Parse every row with csv parser to check that the file is well formed
    // Check rows count
    let rowsCount = 0;
    await new Promise((res, rej) => {
      fs.createReadStream(outFilePath)
        .pipe(csv.parse({ headers: ['id', 'name', 'price', 'date', 'info', 'category'] }))
        .on('data', (row) => {
          rowsCount += 1;
          expect(_.size(row), 'to be', 6);
        })
        .on('end', () => res())
        .on('error', (err) => rej(err));
    });
    expect(rowsCount, 'to be', 50000);
  });

  it('delete', async () => {
    await createTestTable(storage, bucketId, tableName);
    await expect(storage.request('get', `tables/${tableId}`), 'to be fulfilled');
    const deleteTableResponse = await storage.Tables.delete(tableId);
    await expect(storage.Jobs.wait(deleteTableResponse.id), 'to be fulfilled');
    await expect(storage.request('get', `tables/${tableId}`), 'to be rejected');
  });
});
