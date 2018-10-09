// @flow
import _ from 'lodash';
import Storage from './Storage';

export default class Buckets {
  storage: Storage;

  constructor(storage: Object) {
    this.storage = storage;
  }

  create(stage: "in" | "out", name: string, options: Object = {}): Promise<Object> {
    return this.storage.request('post', 'buckets', _.merge({ stage, name }, options));
  }

  get(id: string): Promise<Object> {
    return this.storage.request('get', `buckets/${id}`);
  }

  delete(id: string, force: boolean = false): Promise<Object> {
    let uri = `buckets/${id}`;
    if (force) {
      uri += '?force=1';
    }
    return this.storage.request('delete', uri);
  }
}
