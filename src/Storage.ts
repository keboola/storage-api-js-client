import _ from 'lodash';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import createError from 'http-errors';
import qs from 'qs';

import Buckets from './Buckets';
import Configurations from './Configurations';
import Files from './Files';
import Jobs from './Jobs';
import Tables from './Tables';

axiosRetry(axios, { retries: 5 });

export default class Storage {
  baseUri: string;

  token: string;

  Buckets: Buckets;

  Configurations: Configurations;

  Files: Files;

  Jobs: Jobs;

  Tables: Tables;

  constructor(baseUri: string, token: string) {
    this.baseUri = baseUri;
    this.token = token;
    this.Buckets = new Buckets(this);
    this.Configurations = new Configurations(this);
    this.Files = new Files(this);
    this.Jobs = new Jobs(this);
    this.Tables = new Tables(this);
  }

  async request(
    method: 'head' | 'get' | 'GET' | 'delete' | 'DELETE' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH' | undefined,
    uri: string,
    data: object | null = null
  ): Promise<any> {
    const url = `${this.baseUri}/v2/storage/${uri}`;
    const params = {
      method,
      url,
      headers: { 'X-StorageApi-Token': this.token },
      data: data ? qs.stringify(data) : null,
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

  verifyToken(): Promise<any> {
    return this.request('get', 'tokens/verify');
  }

  async verifyTokenAdmin(): Promise<any> {
    const auth = await this.verifyToken();
    if (!_.has(auth, 'admin')) {
      throw createError(403, 'You need a master Storage token');
    }
    return auth;
  }
}
