var dotenv = require('dotenv');
dotenv.load();

var fs = require('fs');

var s3list = require('s3list');
var AWS = require('aws-sdk');

var files = [];

var list = s3list({
  key: process.env.AWS_ACCESS_KEY_ID,
  secret: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: 'scheduled-scraper'
});

list.on('data', function (data) {
  files.push(data);
});

list.on('end', function () {

  function fetchPdf() {
    var file = files.pop();

    var s3client = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    var params = {
        Bucket: 'scheduled-scraper',
        Key: file.Key
    };

    var sessionParams = {
      totalObjectSize: file.Size
    };

    console.log('Downloading', file);

    var downloader = require('s3-download')(s3client);

    var d = downloader.download(params, sessionParams);

    d.on('error', function (err) {
      console.log(err);
    });

    d.on('part', function (dat) {
      console.log(dat);
    });

    d.on('downloaded', function (dat) {
      fetchPdf();
    });

    var w = fs.createWriteStream('./archive/pdf/' + file.Key);
    d.pipe(w);
  }

  // Kick it off
  fetchPdf();
});
