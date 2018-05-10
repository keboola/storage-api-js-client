## Javascript client for Keboola Storage API

[![Build Status](https://travis-ci.org/keboola/storage-api-js-client.svg?branch=master)](https://travis-ci.org/keboola/storage-api-js-client)
[![Maintainability](https://api.codeclimate.com/v1/badges/9f01593c5e780c783618/maintainability)](https://codeclimate.com/github/keboola/storage-api-js-client/maintainability)

Javascript client for Keboola Connection Storage API. This API client provides client methods to get data from KBC and store data in KBC. The endpoints for working with buckets and tables are covered.

### Installation

1. Install npm package: `yarn add @keboola/storage-api-js-client`


### Usage

```javascript
const { Storage } = require('@keboola/storage-api-js-client');
const storage = new Storage('https://connection.keboola.com', 'TOKEN');

// You can call any request directly
storage.request('get', 'buckets/bucket_id/tables')
  .then(res => _.map(res, item => console.log(item.id)));

// Or use helper methods
storage.Buckets.create(stage, name, description = null, backend = null);
storage.Buckets.get(id);
storage.Buckets.delete(id, force = false);

storage.Files.prepare(name, options = {});
storage.Files.get(id, federationToken = false);

storage.Tables.create(bucket, name, filePath, options = {});
storage.Tables.get(id);
storage.Tables.delete(id);
```
