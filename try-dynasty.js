var _ = require('lodash');
var jf = require('jsonfile');
var s3 = require('s3');

var dotenv = require('dotenv');
dotenv.load();

var credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-west-2'
};

var dynasty = require('Dynasty')(credentials);

var table_name = 'Cases';

var table_options = {
    key_schema: { hash: ['caseNumber', 'string'] },
    throughput: { write: 5, read: 10 }
};

// Create Cases table once-only
dynasty.list()
  .then(function (resp) {
    if (!_.contains(resp.TableNames, table_name)) {
      dynasty.create(table_name, table_options);
    }
  });

var results = jf.readFileSync('./results.json');
var cases = dynasty.table(table_name);

results.forEach(function (result) {
  cases.insert(result)
});

// Drop existing table (convenience function for dev)
function dropCases() {
  dynasty
    .drop(table_name)
    .then(function (resp) {
      console.log(resp);
    });
}
