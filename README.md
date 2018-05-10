## Javascript client for Keboola Storage API

[![Build Status](https://travis-ci.org/keboola/storage-api-js-client.svg?branch=master)](https://travis-ci.org/keboola/storage-api-js-client)
[![Maintainability](https://api.codeclimate.com/v1/badges/9f01593c5e780c783618/maintainability)](https://codeclimate.com/github/keboola/storage-api-js-client/maintainability)

Javascript client for Keboola Connection Storage API. This API client provides client methods to get data from KBC and store data in KBC. The endpoints for working with buckets and tables are covered.

### Installation

1. Install npm package: `yarn add @keboola/storage-api-js-client`


### Usage

```js
const { Storage } = require('@keboola/storage-api-js-client');
const storage = new Storage('https://connection.keboola.com', 'TOKEN');

```
