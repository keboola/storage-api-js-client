const _ = require('lodash');
const sleep = require('sleep-promise');

const StorageError = require('./StorageError');

class Jobs {
  constructor(storage) {
    this.storage = storage;
  }

  wait(id, repeat = 1) {
    if (repeat > 20) {
      throw new StorageError(`Storage job ${id} has not finished even after 10 minutes, try again later.`);
    }
    return this.storage.request('get', `jobs/${id}`)
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

module.exports = Jobs;
