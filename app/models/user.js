var db = require('../config');
var bcrypt = require('bcrypt-nodejs');      //promisify all to create async versions of bcrypt functions
var Promise = require('bluebird');

var User = db.Model.extend({
  //map passwords here.
  tableName: 'users'
});

module.exports = User;
