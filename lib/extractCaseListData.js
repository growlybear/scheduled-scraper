var pdfText = require('pdf-text');
var jf = require('jsonfile');

var extractCaseListData = function (pdf, callback) {

  var out = pdf.replace(/pdf/g, 'json');
  var relevant = [];

  pdfText(pdf, function (err, chunks) {

    if (err) callback(err);

    console.log('Processing new court list pdf:\n   ', pdf);
    console.log('Extracting data...');

    var i = 0;
    var j, caseNum, key, done, values;

    // chunks is an array of strings
    // loosely corresponding to text objects within the pdf
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
          done = key.match(/S CI 20\d{2} \d{5}/);
        // if not, keep going
        } while (!done);

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

    jf.writeFile('results.json', relevant, function (err) {
      console.error(err)
    });

    callback(null, out, relevant);
  });
};

module.exports = extractCaseListData;
