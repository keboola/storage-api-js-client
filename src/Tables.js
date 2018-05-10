const _ = require('lodash');

export default class Tables {
  constructor(client) {
    this.client = client;
  }

  create(id, fileId, primary = []) {
    const bucketId = id.substring(0, id.indexOf('.', 4));
    const tableName = id.substring(id.indexOf('.', 4) + 1);
    const data = {
      name: tableName,
      dataFileId: fileId,
    };
    if (_.size(primary) > 0) {
      data.primaryKey = primary.join(',');
    }
    return this.client.request('post', `buckets/${bucketId}/tables-async`, data)
      .then(res => this.client.Jobs.wait(res.id));
  }

  get(id) {
    return this.client.request('get', `tables/${id}`);
  }

  export(tableId, data = null) {
    return this.client.request('post', `tables/${tableId}/export-async`, data)
      .then(res => this.client.Jobs.wait(res.id))
      .then(res => _.get(res, 'results.file.id'));
  }

  delete(id) {
    return this.client.request('delete', `tables/${id}`);
  }
}
