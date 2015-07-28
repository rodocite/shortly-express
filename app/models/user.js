var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  //map passwords here.
  tableName: 'users'
});

module.exports = User;
