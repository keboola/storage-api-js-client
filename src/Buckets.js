class Buckets {
  constructor(storage) {
    this.storage = storage;
  }

  create(stage, name, description = null, backend = null) {
    const data = { stage, name };
    if (description) {
      data.description = description;
    }
    if (backend) {
      data.backend = backend;
    }
    return this.storage.request('post', 'buckets', data);
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
