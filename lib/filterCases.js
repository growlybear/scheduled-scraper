var pdfText = require('pdf-text');
var jf = require('jsonfile');


var filterCases = function (pdf) {

    var out = pdf.replace(/pdf/g, 'json');
    var relevant = [];

    pdfText(pdf, function(err, chunks) {

        console.log('Processing Copurt List pdf at:', pdf);
        console.log('Extracting data...');

        // chunks is an array of strings
        // loosely corresponding to text objects within the pdf
        var i = 0, j;
        var found = 0;
        var caseNum;

        var key, done, values;

        // limit for dev purposes
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

                found++;
            }
            i++;
        }

        console.log('Found relevant data in Court List page...');

        // save extracted json to the filesystem
        jf.writeFile(out, relevant, function (err) {
            if (err) console.log(err);

            console.log('Writing relevant case data to:', out);
            console.log('Now do something with it!');
        });
    });
};

module.exports = filterCases;
