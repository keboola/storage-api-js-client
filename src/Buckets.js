export default class Buckets {
  constructor(client) {
    this.client = client;
  }

  create(stage, name, description = null) {
    const data = { stage, name };
    if (description) {
      data.description = description;
    }
    return this.client.request('post', 'buckets', data);
  }

  get(id) {
    return this.client.request('get', `buckets/${id}`);
  }

  delete(id, force = false) {
    let uri = `buckets/${id}`;
    if (force) {
      uri += '?force=1';
    }
    return this.client.request('delete', uri);
  }
}
