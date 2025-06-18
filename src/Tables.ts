import _ from 'lodash';
import aws from 'aws-sdk';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { execSync } from 'child_process';
import parse from 'csv-parse/lib/sync';
import fs from 'fs';
import os from 'os';
import qs from 'qs';
import Storage from './Storage';

axiosRetry(axios, { retries: 5 });

enum TableListOptionConst {
  attributes, columns
}
type TableListOption = keyof typeof TableListOptionConst;

export default class Tables {
  storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  async uploadFileToS3(name: string, filePath: string): Promise<Record<string, any>> {
    const file = await this.storage.Files.prepare(name, { federationToken: 1 });
    const s3 = new aws.S3({
      accessKeyId: file.uploadParams.credentials.AccessKeyId,
      secretAccessKey: file.uploadParams.credentials.SecretAccessKey,
      sessionToken: file.uploadParams.credentials.SessionToken,
    });
    await s3.putObject({
      Bucket: file.uploadParams.bucket,
      Key: file.uploadParams.key,
      Body: fs.readFileSync(filePath),
    }).promise();
    return file;
  }

  async create(bucket: string, name: string, filePath: string, options: Record<string, any> = {}): Promise<void> {
    const file = await this.uploadFileToS3(name, filePath);

    const requestResult = await this.storage.request(
      'post',
      `buckets/${bucket}/tables-async`,
      _.merge({
        name,
        dataFileId: file.id,
      }, options)
    );

    return this.storage.Jobs.wait(requestResult.id);
  }

  async import(tableId: string, filePath: string, options: Record<string, any> = {}): Promise<void> {
    const file = await this.uploadFileToS3(tableId, filePath);

    const requestResult = await this.storage.request(
      'post',
      `tables/${tableId}/import-async`,
      _.merge({
        dataFileId: file.id,
      }, options)
    );

    return this.storage.Jobs.wait(requestResult.id);
  }

  list(bucket: string, include?: Array<TableListOption>): Promise<any> {
    let uri = `buckets/${bucket}/tables`;
    if (include && _.size(include) > 0) {
      uri += `?include=${include.join(',')}`;
    }
    return this.storage.request('get', uri);
  }

  get(id: string): Promise<any> {
    return this.storage.request('get', `tables/${id}`);
  }

  async preview(tableId: string, options: Record<string, any> = {}): Promise<Array<any>> {
    let uri = `tables/${tableId}/data-preview`;
    if (_.size(options)) {
      uri += `?${qs.stringify(options)}`;
    }
    const res = await this.storage.request('get', uri);
    return parse(res, { columns: true });
  }

  async getTableFile(tableId: string, options: Record<string, any> = {}): Promise<any> {
    const requestRes = await this.storage.request('post', `tables/${tableId}/export-async`, options);
    const jobRes = await this.storage.Jobs.wait(requestRes.id);
    const fileId = _.get(jobRes, 'results.file.id') as unknown as string;
    return this.storage.Files.get(fileId, true);
  }

  async export(tableId: string, options: Record<string, any> = {}): Promise<Array<any>> {
    const file = await this.getTableFile(tableId, options);

    const fileRes = await axios.get(file.url);
    if (!file.isSliced) {
      return fileRes.data;
    }

    const slices = _.map(fileRes.data.entries, (r) => r.url);
    const s3 = new aws.S3({
      accessKeyId: file.credentials.AccessKeyId,
      secretAccessKey: file.credentials.SecretAccessKey,
      sessionToken: file.credentials.SessionToken,
    });
    const s3Files = await Promise.all(_.map(slices, (sliceUrl) => s3.getObject({
      Bucket: file.s3Path.bucket,
      Key: sliceUrl.substr(sliceUrl.indexOf('/', 5) + 1),
    }).promise()));

    // Read contents of all slice files
    const csvFiles = _.map(s3Files, (s3File) => (s3File.Body ? s3File.Body.toString('utf8') : null));

    // Parse csv of each slice to array
    const csvSlices = _.map(csvFiles, (csvFile: string) => parse(csvFile));
    // Union all arrays
    return _.flatten(csvSlices);
  }

  async exportToFile(tableId: string, options: Record<string, any> = {}, filePath: string): Promise<void> {
    const file = await this.getTableFile(tableId, options);

    const fileRes = await axios.get(file.url);
    if (!file.isSliced) {
      fs.writeFileSync(filePath, fileRes.data);
      return Promise.resolve(undefined);
    }

    const slices = _.map(fileRes.data.entries, (r) => r.url);
    const s3 = new aws.S3({
      accessKeyId: file.credentials.AccessKeyId,
      secretAccessKey: file.credentials.SecretAccessKey,
      sessionToken: file.credentials.SessionToken,
    });

    const tempDir = `${os.tmpdir()}/storage-${Date.now()}-${_.random(1000, 9999)}`;
    fs.mkdirSync(tempDir);

    let i = 0;
    await Promise.all(_.map(slices, (sliceUrl) => {
      const current = i;
      i += 1;
      const objectRequest = s3.getObject({
        Bucket: file.s3Path.bucket,
        Key: sliceUrl.substr(sliceUrl.indexOf('/', 5) + 1),
      });
      const outStream = fs.createWriteStream(`${tempDir}/${current}`);
      const readStream = objectRequest.createReadStream();
      readStream.on('error', (err) => outStream.emit('S3 Download Error', err));
      readStream.pipe(outStream);
      return new Promise((resolve, reject) => {
        outStream.on('end', () => resolve(undefined));
        outStream.on('finish', () => resolve(undefined));
        outStream.on('error', (error) => reject(error));
      });
    }));

    execSync(`cat ${tempDir}/* > ${filePath}`);
    execSync(`rm -rf ${tempDir}`);
    return Promise.resolve(undefined);
  }

  delete(id: string): Promise<any> {
    return this.storage.request('delete', `tables/${id}`);
  }
}
