import _ from 'lodash';
import Storage from './Storage';

export default class Files {
  storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  prepare(name: string, options: Record<string, any> = {}): Promise<any> {
    const data = _.merge({ name }, options);
    data.federationToken = true;
    return this.storage.request('post', 'files/prepare', data);
  }

  get(id: string, federationToken = false): Promise<any> {
    let uri = `files/${id}`;
    if (federationToken) {
      uri += '?federationToken=1';
    }
    return this.storage.request('get', uri);
  }
}
