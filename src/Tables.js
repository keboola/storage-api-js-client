const _ = require('lodash');
const aws = require('aws-sdk');
const fs = require('fs');
const Promise = require('bluebird');

aws.config.setPromisesDependency(Promise);

export default class Tables {
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

  export(tableId, data = null) {
    return this.storage.request('post', `tables/${tableId}/export-async`, data)
      .then(res => this.storage.Jobs.wait(res.id))
      .then(res => _.get(res, 'results.file.id'));
  }

  delete(id) {
    return this.storage.request('delete', `tables/${id}`);
  }
}
