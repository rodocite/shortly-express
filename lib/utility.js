var request = require('request');
var db = require('../app/config.js');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/
var bcrypt = require('bcrypt');
var salt = '$2a$10$4PdROD0B.hnlqm2axSfKoO';
exports.session = true;

exports.isUser = function(username, password, table, callback){
  db.knex(table)
    .where('username', '=', username).then(function(result) {
      if(result[0] && result[0]['password'] === password) {
        callback(true);
      } else {
        callback(false);
      }
    });
};

exports.encrypt = function(password, callback){
    bcrypt.hash(password, salt, function(err, hash) {
    callback(hash);
  });
};

// bcrypt.genSalt(10, function(err, salt) {
//     bcrypt.hash('B4c0/\/', salt, function(err, hash) {
//         // Store hash in your password DB.
//     });
// });
