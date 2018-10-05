// @flow
import _ from 'lodash';
import createError from 'http-errors';
import sleep from 'sleep-promise';
import Storage from './Storage';

class Jobs {
  storage: Storage;

  constructor(storage: Object) {
    this.storage = storage;
  }

  async wait(id: string, repeat: number = 1): Promise<void> {
    if (repeat > 20) {
      throw createError(400, `Storage job ${id} has not finished even after 10 minutes, try again later.`);
    }
    const res = await this.storage.request('get', `jobs/${id}`);
    if (_.get(res, 'status') === 'waiting' || _.get(res, 'status') === 'processing') {
      await sleep(3000 * repeat);
      return this.wait(id, repeat + 1);
    }
    if (_.get(res, 'status') === 'success') {
      return res;
    }
    throw createError(400, `Storage job ${id} failed with error ${JSON.stringify(res)}`);
  }
}

module.exports = Jobs;
