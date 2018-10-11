// @flow
import _ from 'lodash';
import Storage from './Storage';

export default class Configurations {
  storage: Storage;

  constructor(storage: Object) {
    this.storage = storage;
  }

  async create(
    componentName: string,
    name: string,
    options: ?{
      configurationId: ?string,
      description: ?string,
      configuration: ?Object,
      state: ?Object,
      changeDescription: ?string,
    }
  ): Promise<string> {
    let params = { name };
    if (options) {
      params = _.merge(params, options);
      if (_.has(params, 'configuration')) {
        params.configuration = JSON.stringify(params.configuration);
      }
      if (_.has(params, 'state')) {
        params.state = JSON.stringify(params.state);
      }
    }

    const res = await this.storage.request(
      'post',
      `components/${componentName}/configs`,
      params
    );
    return res.id;
  }

  get(componentName: string, id: string): Promise<any> {
    return this.storage.request('get', `components/${componentName}/configs/${id}`);
  }

  delete(componentName: string, id: string): Promise<any> {
    return this.storage.request('delete', `components/${componentName}/configs/${id}`);
  }
}
