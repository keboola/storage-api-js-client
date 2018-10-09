// @flow
import _ from 'lodash';
import Storage from './Storage';

export default class Buckets {
  storage: Storage;

  constructor(storage: Object) {
    this.storage = storage;
  }

  create(stage: "in" | "out", name: string, options: Object = {}): Promise<any> {
    return this.storage.request('post', 'buckets', _.merge({ stage, name }, options));
  }

  list(include: ?Array<string>): Promise<any> {
    let uri = 'buckets';
    if (include && _.size(include) > 0) {
      uri += `?${include.join(',')}`;
    }
    return this.storage.request('get', uri);
  }

  get(id: string): Promise<any> {
    return this.storage.request('get', `buckets/${id}`);
  }

  delete(id: string, force: boolean = false): Promise<any> {
    let uri = `buckets/${id}`;
    if (force) {
      uri += '?force=1';
    }
    return this.storage.request('delete', uri);
  }
}
