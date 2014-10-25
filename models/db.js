var mongoose = require('mongoose');
var dbURI = process.env.MONGOHQ_URL;
// var dbURI = 'mongodb://localhost/mortgage_listings';

mongoose.connect(dbURI);

mongoose.connection.on('error', function (err) {
    console.log('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', function () {
    console.log('Mongoose disconnected');
});

// NOTE avoid leaking db connections in case of application errors
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose disconnected through app termination');
        process.exit(0);
    });
});
