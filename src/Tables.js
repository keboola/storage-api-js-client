// @flow
import _ from 'lodash';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import csvString from 'csv-string';
import fs from 'fs';
import Storage from './Storage';

const aws = require('aws-sdk');

axiosRetry(axios, { retries: 5 });

export default class Tables {
  storage: Storage;

  constructor(storage: Object) {
    this.storage = storage;
  }

  async create(bucket: string, name: string, filePath: string, options: Object = {}): Promise<void> {
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

  list(bucket: string, include: ?Array<"attributes" | "columns">): Promise<any> {
    let uri = `buckets/${bucket}/tables`;
    if (include && _.size(include) > 0) {
      uri += `?include=${include.join(',')}`;
    }
    return this.storage.request('get', uri);
  }

  get(id: string): Promise<Object> {
    return this.storage.request('get', `tables/${id}`);
  }

  async export(tableId: string, options: Object = {}): Promise<Array<any>> {
    const requestRes = await this.storage.request('post', `tables/${tableId}/export-async`, options);
    const jobRes = await this.storage.Jobs.wait(requestRes.id);
    const fileId = _.get(jobRes, 'results.file.id');
    const file = await this.storage.Files.get(fileId, true);

    const fileRes = await axios.get(file.url);
    if (!file.isSliced) {
      return fileRes.data;
    }

    const slices = _.map(fileRes.data.entries, r => r.url);
    const s3 = new aws.S3({
      accessKeyId: file.credentials.AccessKeyId,
      secretAccessKey: file.credentials.SecretAccessKey,
      sessionToken: file.credentials.SessionToken,
    });
    const s3Files = await Promise.all(_.map(slices, sliceUrl => s3.getObject({
      Bucket: file.s3Path.bucket,
      Key: sliceUrl.substr(sliceUrl.indexOf('/', 5) + 1),
    }).promise()));
    const csvFiles = _.map(s3Files, s3File => s3File.Body.toString('utf8'));
    const csvSlices = _.map(csvFiles, csvFile => csvString.parse(csvFile));
    return _.reduce(csvSlices);
  }

  delete(id: string): Promise<any> {
    return this.storage.request('delete', `tables/${id}`);
  }
}
