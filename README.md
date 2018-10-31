## Javascript client for Keboola Storage API

[![Build Status](https://travis-ci.org/keboola/storage-api-js-client.svg?branch=master)](https://travis-ci.org/keboola/storage-api-js-client)
[![Maintainability](https://api.codeclimate.com/v1/badges/9f01593c5e780c783618/maintainability)](https://codeclimate.com/github/keboola/storage-api-js-client/maintainability)

Javascript client for Keboola Connection Storage API. This API client provides client methods to get data from KBC and store data in KBC. The endpoints for working with buckets and tables are covered.

Tables import and export is processed in-memory so it is suitable rather for smaller tables.

### Installation

1. Install npm package: `yarn add @keboola/storage-api-js-client`


### Usage

You can use ES6 imports (`import Storage from '@keboola/storage-api-js-client';`) or require (`const Storage = require('@keboola/storage-api-js-client').default;`).

```javascript
const Storage = require('@keboola/storage-api-js-client').default;
const storage = new Storage('https://connection.keboola.com', 'TOKEN');

// You can call any request directly
storage.request('get', 'buckets/bucket_id/tables')
  .then(res => _.map(res, item => console.log(item.id)));

// Or use helper methods
storage.Buckets.create(stage: "in" | "out", name: string, options: Object = {}): Promise<any>;
storage.Buckets.get(id: string): Promise<any>;
storage.Buckets.list(include: ?Array<"attributes" | "metadata" | "linkedBuckets">): Promise<any>;
storage.Buckets.delete(id: string, force: boolean = false): Promise<any>;

storage.Configurations.create(componentName: string, name: string, options: ?{ configurationId: ?string, description: ?string, configuration: ?Object, state: ?Object, changeDescription: ?string }): Promise<string>;
storage.Configurations.get(componentName: string, id: string): Promise<any>;
storage.Configurations.delete(componentName: string, id: string): Promise<any>;
storage.Configurations.listComponents(componentType: ?string, include: ?Array<'configuration' | 'rows'>, isDeleted: ?boolean);
storage.Configurations.list(component: string, isDeleted: ?boolean);

storage.Files.prepare(name: string, options: Object = {}): Promise<any>;
storage.Files.get(id: string, federationToken: boolean = false): Promise<any>;

storage.Tables.create(bucket: string, name: string, filePath: string, options: Object = {}): Promise<void>;
storage.Tables.get(id: string): Promise<any>;
storage.Tables.list(bucket: string, include: ?Array<"attributes" | "columns">): Promise<any>;
storage.Tables.export(tableId: string, options: Object = {}): Promise<any>;
storage.Tables.delete(id: string): Promise<any>;
```


### Tests and development

You need to set some env variables for the tests:
- `KBC_URL`
- `KBC_TOKEN` - a *master* token
- `KBC_COMPONENT` - name of some component used for Components Configurations API tests
Tests can be run using `yarn test`.

The repository requires conforming to a set of coding standards based on [AirBnB code standard](https://github.com/airbnb/javascript) and [Flow type annotations](https://flow.org/en/docs/types/). Both standards are checked by ESlint. You can run the check using `yarn lint`.

### Deployment

Deployment to NPM compiles the code from `src` directory to `lib` directory. Flow files are compiled to ES6 Javascript and original files are copied with `.flow` extension. (So e.g. `src/Buckets.js` is copied to `lib/Buckets.js.flow` and compiled to `lib/Buckets.js`).
