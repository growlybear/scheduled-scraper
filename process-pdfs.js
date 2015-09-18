var fs = require('fs');
var path = require('path');

var jf = require('jsonfile');
var extractCaseListData = require('./lib/extractCaseListData');

var p = './archive/pdf';
var process = [];

function writeResults(discard, file, data) {
  jf.writeFile(file, data, function (err) {
    if (err) console.error(err);
    var next = process.pop();
    extractCaseListData('./' + next, writeResults);
  });
}

fs.readdir(p, function (err, files) {
  if (err) {
    throw err;
  }

  var mike = ['13-11-2014.pdf'];

  files.map(function (file) {
    return path.join(p, file);
  }).filter(function (file) {
    var re = /\/\d{2}-\d{2}-\d{4}\.pdf/;
    return fs.statSync(file).isFile() && re.test(file);
  }).forEach(function (file) {
    process.push(file);
  });

  var first = process.pop();

  extractCaseListData('./' + first, writeResults);
});
