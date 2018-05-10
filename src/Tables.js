const _ = require('lodash');

export default class Tables {
  constructor(storage) {
    this.storage = storage;
  }

  create(bucket, name, fileId, primary = []) {
    const data = {
      name,
      dataFileId: fileId,
    };
    if (_.size(primary) > 0) {
      data.primaryKey = primary.join(',');
    }
    return this.storage.request('post', `buckets/${bucket}/tables-async`, data)
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
