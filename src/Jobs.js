import sleep from 'sleep-promise';
import { StorageError } from './Storage';

const _ = require('lodash');

export default class Jobs {
  constructor(client) {
    this.client = client;
  }

  wait(id, repeat = 1) {
    if (repeat > 20) {
      throw new StorageError(`Storage job ${id} has not finished even after 10 minutes, try again later.`);
    }
    return this.client.request('get', `jobs/${id}`)
      .then((res) => {
        if (_.get(res, 'status') === 'waiting' || _.get(res, 'status') === 'processing') {
          return sleep(3000 * repeat)
            .then(() => this.wait(id, repeat + 1));
        }
        if (_.get(res, 'status') === 'success') {
          return res;
        }
        throw new StorageError(`Storage job ${id} failed with error ${JSON.stringify(res)}`);
      });
  }
}
