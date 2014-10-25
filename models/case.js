var mongoose = require('mongoose');
var Promise = require('bluebird');

var Schema = mongoose.Schema;

var CaseSchema = new Schema({

    caseNumber: { type: String },   // "caseNumber": "S CI 2014 03644"
    actionCode: { type: String },   // "actionCode": "COM Mortgages & Other Securities",
    filedDate:  { type: Date   },   // "filedDate": "17-Jul-2014",
    locality:   { type: String },   // "locality": "Supreme Court 436 Lonsdale St",
    caseTitle:  { type: String },   // "caseTitle": "National Australia Bank Limited (ACN 004 044 937) v. Tess Aust. Pty Ltd (ABN 12 004 044 937) & Ors.",
    caseStatus: { type: String }    // "caseStatus": "Open",

});

var Case = mongoose.model('Case', CaseSchema);

// Enable synchronous saves
// cf. http://stackoverflow.com/questions/25555139/bluebird-promisies-crud-example-using-nodejs-express-and-mongoose?rq=1
Promise.promisifyAll(Case);
Promise.promisifyAll(Case.prototype);

module.exports = Case;
