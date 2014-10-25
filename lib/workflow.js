var fs = require('fs');
var path = require('path');

var concat = require('concat-stream');
var hyperquest = require('hyperquest');
var moment = require('moment');
var async = require('async');
var cheerio = require('cheerio');
var Promise = require('bluebird');

var s3 = require('s3');
var pdfText = require('pdf-text');
var jf = require('jsonfile');

var db = require('../models/db');
var Case = require('../models/case');


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

var extractDailyListUrl = function (source, callback) {

    var $ = cheerio.load(fs.readFileSync(source, {
        encoding: 'utf8'
    }));

    var selector = '#publication a';
    var link = $(selector).attr('href');

    if (!link) {
        callback(new Error('No Court List link found'));
    } else {
        callback(null, link);
    }
};

var downloadListPdf = function (url, callback) {

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

var uploadListPdf = function (file, callback) {
    var s3 = require('s3');
    var name = path.basename(file);

    var client = s3.createClient({
        s3Options: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY
        }
    });

    var params = {
        localFile: file,
        s3Params: {
            Bucket: 'scheduled-scraper',
            Key: name
        }
    };

    var uploader = client.uploadFile(params);

    uploader.on('error', function(err) {
        console.error('Unable to upload file to S3:', err.stack);
        callback(err);
    });

    uploader.on('progress', function() {
        console.log('progress', uploader.progressMd5Amount, uploader.progressAmount, uploader.progressTotal);
    });

    uploader.on('end', function() {
        console.error('File successfully uploaded to S3:', name);
        callback(null, file);
    });

};

var extractCaseListData = function (pdf, callback) {

    var out = pdf.replace(/pdf/g, 'json');
    var relevant = [];

    pdfText(pdf, function (err, chunks) {

        if (err) callback(err);

        console.log('Processing new court list pdf:\n   ', pdf);
        console.log('Extracting data...');

        // chunks is an array of strings
        // loosely corresponding to text objects within the pdf
        var i = 0, j;
        var caseNum;

        var key, done, values;

        while (chunk = chunks[i]) {
            // look for the relevant action code
            if (chunks[i].indexOf('COM Mortgages') >= 0) {
                // we've found a matching row, let's turn it into a JSON object
                values = {
                    caseStatus: chunks[i + 1],
                    actionCode: chunks[i],
                    filedDate: chunks[i - 1],
                    locality: chunks[i - 2],
                    caseTitle: []
                };

                // the case title is of arbitrary length, so we need to concatenate
                // everything backwards until we get as far back as the case number
                j = i - 2;
                do {
                    // skip the locality
                    key = chunks[--j];
                    // pop the value of this chunk into the caseTitle array
                    values.caseTitle.unshift(key);
                    // check to see if we're at the end
                    done = key.match(/S CI 2014 \d{5}/);
                // if not, keep going
                } while ( !done );

                // take the key out of the case title array and store it separately
                values.caseNumber = values.caseTitle.shift();
                // convert the case title to a sanitised string
                values.caseTitle = values.caseTitle.join(' ').replace(/\s+/g, ' ').trim();

                // now push our finished object into the relevant items array
                relevant.push(values);
            }
            i++;
        }
        console.log('Data extracted');

        callback(null, out, relevant);
    });
};

var saveCasesJson = function (path, json, callback) {

    var operations = [];

    // Filter insignificant errors which shouldn't interrupt execution flow
    function clientError(err) {
        var re = /MongoError: E11000 duplicate key/;
        // Don't worry about saving duplicate documents
        if (re.test(err)) err = null;

        return err;
    }

    Promise.each(json, function (obj) {
        var item = new Case(obj);
        return item.saveAsync()
            .spread(function(savedCase, numAffected) {
                // savedCase will be returned from the save operation
                // numAffected can be safely ignored
                // console.log(JSON.stringify(savedCase));
            })
            .catch(clientError, function (err) {
                console.log('An error occured writing item to db:', err);
            });
    }).then(function () {
        console.log('All new cases saved to db');
        callback(null, true);
    }).catch(function (err) {
        console.log('Unable to save all cases to db');
        callback(err);
    });
};


module.exports = {
    fetchCaseListPage: fetchCaseListPage,
    extractDailyListUrl: extractDailyListUrl,
    downloadListPdf: downloadListPdf,
    uploadListPdf: uploadListPdf,
    extractCaseListData: extractCaseListData,
    saveCasesJson: saveCasesJson
};
