// @flow
import _ from 'lodash';
import QueryString from 'querystring';
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

  listComponents(componentType: ?string, include: ?Array<'configuration' | 'rows'>, isDeleted: ?boolean) {
    const params = {};
    if (componentType != null) {
      params.componentType = componentType;
    }
    if (include != null) {
      params.include = include.join(',');
    }
    if (isDeleted != null) {
      params.isDeleted = isDeleted;
    }
    let uri = 'components';
    if (_.size(params)) {
      uri += `?${QueryString.stringify(params)}`;
    }

    return this.storage.request('get', uri);
  }

  list(component: string, isDeleted: ?boolean) {
    const params = {};
    if (isDeleted != null) {
      params.isDeleted = isDeleted;
    }
    let uri = `components/${component}/configs`;
    if (_.size(params)) {
      uri += `?${QueryString.stringify(params)}`;
    }
    return this.storage.request('get', uri);
  }
}
