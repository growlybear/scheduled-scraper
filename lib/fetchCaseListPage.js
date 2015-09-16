var fs = require('fs');
var path = require('path');
var moment = require('moment');
var hyperquest = require('hyperquest');

var fetchCaseListPage = function (url, callback) {

    var timestamp = moment().format();
    var dest = path.normalize(__dirname + '/../archive/html/' + timestamp + '.html');

    var out = fs.createWriteStream(dest);

    console.log('Fetching page:\n   ', url);

    hyperquest.get(url).pipe(out)
        .on('close', function () {
            console.log('Saving page to:\n   ', dest);

            callback(null, dest);
        })
        .on('error', function () {
            callback(new Error('Error fetching page at: ' + url));
        });
};

module.exports = fetchCaseListPage;
