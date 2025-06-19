import _ from 'lodash';
import Storage from './Storage';

enum BucketListOptionConst {
  attributes, metadata, linkedBuckets
}
type BucketListOption = keyof typeof BucketListOptionConst;

export default class Buckets {
  storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  create(stage: 'in' | 'out', name: string, options: any = {}): Promise<any> {
    return this.storage.request('post', 'buckets', _.merge({ stage, name }, options));
  }

  list(include?: Array<BucketListOption>): Promise<any> {
    let uri = 'buckets';
    if (include && _.size(include) > 0) {
      uri += `?include=${include.join(',')}`;
    }
    return this.storage.request('get', uri);
  }

  get(id: string): Promise<any> {
    return this.storage.request('get', `buckets/${id}`);
  }

  delete(id: string, force = false): Promise<any> {
    let uri = `buckets/${id}?async=1`;
    if (force) {
      uri += '&force=1';
    }
    return this.storage.request('delete', uri);
  }
}
