const axios = require('axios');
const axiosRetry = require('axios-retry');
const _ = require('lodash');
const aws = require('aws-sdk');
const csvString = require('csv-string');
const fs = require('fs');
const Promise = require('bluebird');

axiosRetry(axios, { retries: 5 });
aws.config.setPromisesDependency(Promise);

class Tables {
  constructor(storage) {
    this.storage = storage;
  }

  create(bucket, name, filePath, options = {}) {
    return this.storage.Files.prepare(name, { federationToken: 1 })
      .then((file) => {
        const s3 = new aws.S3({
          accessKeyId: file.uploadParams.credentials.AccessKeyId,
          secretAccessKey: file.uploadParams.credentials.SecretAccessKey,
          sessionToken: file.uploadParams.credentials.SessionToken,
        });
        return s3.putObject({
          Bucket: file.uploadParams.bucket,
          Key: file.uploadParams.key,
          Body: fs.readFileSync(filePath),
        }).promise()
          .then(() => file.id);
      })
      .then(res => this.storage.request('post', `buckets/${bucket}/tables-async`, _.merge({
        name,
        dataFileId: res,
      }, options)))
      .then(res => this.storage.Jobs.wait(res.id));
  }

  get(id) {
    return this.storage.request('get', `tables/${id}`);
  }

  export(tableId, options = {}) {
    return this.storage.request('post', `tables/${tableId}/export-async`, options)
      .then(res => this.storage.Jobs.wait(res.id))
      .then(res => _.get(res, 'results.file.id'))
      .then(id => this.storage.Files.get(id, true))
      .then((file) => {
        const s3 = new aws.S3({
          accessKeyId: file.credentials.AccessKeyId,
          secretAccessKey: file.credentials.SecretAccessKey,
          sessionToken: file.credentials.SessionToken,
        });
        return axios.get(file.url)
          .then((res) => {
            if (!file.isSliced) {
              return res.data;
            }
            return Promise.resolve(_.map(res.data.entries, r => r.url))
              .then(slices => Promise.all(_.map(slices, sliceUrl => s3.getObject({
                Bucket: file.s3Path.bucket,
                Key: sliceUrl.substr(sliceUrl.indexOf('/', 5) + 1),
              }).promise())))
              .then(s3Files => _.map(s3Files, s3File => s3File.Body.toString('utf8')))
              .then(csvFiles => _.map(csvFiles, csvFile => csvString.parse(csvFile)))
              .then(csvSlices => _.reduce(csvSlices));
          });
      });
  }

  delete(id) {
    return this.storage.request('delete', `tables/${id}`);
  }
}

module.exports = Tables;
