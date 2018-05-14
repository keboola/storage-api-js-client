const _ = require('lodash');

class Buckets {
  constructor(storage) {
    this.storage = storage;
  }

  create(stage, name, options = {}) {
    return this.storage.request('post', 'buckets', _.merge({ stage, name }, options));
  }

  get(id) {
    return this.storage.request('get', `buckets/${id}`);
  }

  delete(id, force = false) {
    let uri = `buckets/${id}`;
    if (force) {
      uri += '?force=1';
    }
    return this.storage.request('delete', uri);
  }
}

module.exports = Buckets;
