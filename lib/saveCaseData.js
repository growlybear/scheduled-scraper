var Promise = require('bluebird');
var Case = require('../models/case');

var saveCaseData = function (path, json, callback) {

  // Filter insignificant errors which shouldn't interrupt execution flow
  function clientError(err) {
    var re = /E11000 duplicate key/;
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
    console.log('Unable to save all cases to db, continuing ...');

    callback(err);
  });
};

module.exports = saveCaseData;
