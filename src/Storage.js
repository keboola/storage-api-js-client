const _ = require('lodash');
const axios = require('axios');
const Promise = require('bluebird');
const QueryString = require('querystring');

const Buckets = require('./Buckets');
const Files = require('./Files');
const Jobs = require('./Jobs');
const StorageError = require('./StorageError');
const Tables = require('./Tables');

export default class Storage {
  constructor(baseUri, token) {
    this.baseUri = baseUri;
    this.token = token;
    this.Buckets = new Buckets(this);
    this.Files = new Files(this);
    this.Jobs = new Jobs(this);
    this.Tables = new Tables(this);
  }

  request(method, uri, data = null) {
    const url = `${this.baseUri}/v2/storage/${uri}`;
    const params = {
      method,
      url,
      headers: { 'X-StorageApi-Token': this.token },
    };
    if (data) {
      params.data = _.isObject(data) ? QueryString.stringify(data) : data;
    }
    return axios(params)
      .catch((err) => {
        if (_.get(err, 'response.status', null) === 401) {
          throw StorageError.unauthorized('Invalid access token');
        }
        const message = _.get(err, 'response.data.error', err.message);
        const code = _.get(err, 'response.status', 0);
        throw StorageError.error(
          `Storage request ${method} ${url} failed with code ${code} and message: ${message}`,
          code
        );
      })
      .then(res => res.data);
  }

  verifyToken() {
    return this.request('get', 'tokens/verify');
  }

  verifyTokenAdmin() {
    return this.verifyToken()
      .then(auth => new Promise((resolve, reject) => {
        if (!_.has(auth, 'admin')) {
          reject(StorageError.error('You need a master Storage token', 403));
        }
        resolve();
      }).then(() => auth));
  }
}
