// @flow
import _ from 'lodash';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import createError from 'http-errors';
import QueryString from 'querystring';

import Buckets from './Buckets';
import Files from './Files';
import Jobs from './Jobs';
import Tables from './Tables';

axiosRetry(axios, { retries: 5 });

class Storage {
  baseUri: string;

  token: string;

  Buckets: Buckets;

  Files: Files;

  Jobs: Jobs;

  Tables: Tables;

  constructor(baseUri: string, token: string) {
    this.baseUri = baseUri;
    this.token = token;
    this.Buckets = new Buckets(this);
    this.Files = new Files(this);
    this.Jobs = new Jobs(this);
    this.Tables = new Tables(this);
  }

  async request(method: string, uri: string, data: any = null): Promise<Object> {
    const url = `${this.baseUri}/v2/storage/${uri}`;
    const params = {
      method,
      url,
      headers: { 'X-StorageApi-Token': this.token },
      data: data ? QueryString.stringify(data) : null,
    };
    try {
      const res = await axios(params);
      return res.data;
    } catch (err) {
      if (_.get(err, 'response.status', null) === 401) {
        throw createError(401, 'Invalid access token');
      }
      const message = _.get(err, 'response.data.error', err.message);
      const code = _.get(err, 'response.status', 0);
      throw createError(
        code,
        `Storage request ${method} ${url} failed with code ${code} and message: ${message}`
      );
    }
  }

  verifyToken(): Promise<Object> {
    return this.request('get', 'tokens/verify');
  }

  async verifyTokenAdmin(): Promise<Object> {
    const auth = await this.verifyToken();
    if (!_.has(auth, 'admin')) {
      Promise.reject(createError(403, 'You need a master Storage token'));
    }
    return auth;
  }
}

module.exports = Storage;
