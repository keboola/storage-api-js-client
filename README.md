## Javascript client for Keboola Storage API

[![Build](https://github.com/keboola/storage-api-js-client/workflows/Build/badge.svg)](https://github.com/keboola/storage-api-js-client/actions)
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
storage.Tables.import(tableId: string, filePath: string, options: Object = {}): Promise<void>;
storage.Tables.export(tableId: string, options: Object = {}): Promise<any>;
storage.Tables.exportToFile(tableId: string, options: Object = {}, path: string): Promise<any>;
storage.Tables.delete(id: string): Promise<any>;
```

This will:
1. Generate TypeScript declaration files (`yarn build:types`)
2. Compile TypeScript to JavaScript (`yarn build:js`)

The compiled code will be placed in the `dist` directory.

### Tests and development

You need to set some env variables for the tests into `.env` file in the root of the repository. 
The `.env` file should contain the following variables:
- `KBC_URL`
- `KBC_TOKEN`
- `KBC_COMPONENT` - name of some component used for Components Configurations API tests
Tests can be run using `yarn test`.
