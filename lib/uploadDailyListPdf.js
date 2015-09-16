var fs = require('fs');
var path = require('path');

var s3 = require('s3');
var ProgressBar = require('progress');

var uploadDailyListPdf = function (file, callback) {

  console.log('Uploading backup pdf to S3:');

  var s3 = require('s3');
  var name = path.basename(file);

  // FIXME
  global.uploaded += name;

  var client = s3.createClient({
    s3Options: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  var params = {
    localFile: file,
    s3Params: {
      Bucket: 'scheduled-scraper',
      ACL: 'public-read',
      Key: name
    }
  };

  var uploader = client.uploadFile(params);

  var bar = new ProgressBar('    ' + name + ' [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 40,
    total: fs.statSync(file).size
  });

  var uploaded = 0;

  uploader.on('error', function (err) {
    console.error('Unable to upload file to S3:', err.stack);

    callback(err);
  });

  uploader.on('progress', function () {
    bar.tick(uploader.progressAmount - uploaded);
    uploaded = uploader.progressAmount;
  });

  uploader.on('end', function () {
    console.log('File upload complete');

    callback(null, file);
  });
};

module.exports = uploadDailyListPdf;
