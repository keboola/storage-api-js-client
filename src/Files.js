const _ = require('lodash');

export default class Files {
  constructor(storage) {
    this.storage = storage;
  }

  prepare(name, options = {}) {
    const data = _.merge({ name }, options);
    return this.storage.request('post', 'files/prepare', data);
  }

  get(id, federationToken = false) {
    let uri = `files/${id}`;
    if (federationToken) {
      uri += '?federationToken=1';
    }
    return this.storage.request('get', uri);
  }
}

module.exports = Files;
