var fs = require('fs');
var path = require('path');
var hyperquest = require('hyperquest');

var downloadDailyListPdf = function (url, callback) {

    var regex = /[\d-]*\.pdf/;
    var dest = path.normalize(__dirname + '/../archive/pdf/' + regex.exec(url)[0]);

    var out = fs.createWriteStream(dest);

    hyperquest.get(url).pipe(out).on('close', function () {
        console.log('Downloading pdf:\n   ', url);
        console.log('Saving pdf to:\n   ', dest);

        callback(null, dest);
    }).on('error', function (err) {
        callback(err.message);
    });
};

module.exports = downloadDailyListPdf;
