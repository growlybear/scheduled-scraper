var fs = require('fs');
var cheerio = require('cheerio');

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

module.exports = extractDailyListUrl;
