var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var sessions = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.post('/links',
function(req, res) {
  console.log('POST request to /links received.');
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  //Valid URL found
  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      //console.log('Valid URL found', uri); //' found.attributes:', found.attributes);
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        //Valid Website Found
        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/logout',function(req, res) {
  util.session = false;
  res.redirect('/login');
});

app.get('/',
function(req, res) {
  if(util.session) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/create',
function(req, res) {
  if(util.session) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/links',
function(req, res) {
  if(util.session) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  } else {
   res.redirect('/login');
  }
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

//POST from Login: Read the username and the password
app.post('/login',                          //save the username and pwd in temporary variables and query the users db for authentication
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var table = 'users';

  util.encrypt(password, function(hash) {
    util.isUser(username, hash, table, function(found) {
      if(found) {
        console.log('Found', username, ' in table:', table);
        util.session = true;                                                  //UNCOMMENT
        res.redirect('/');
      } else {
        console.log('Could not find', username, ' in table:', table);
        res.redirect('/login');
      }
    });
  });
});

/*
  util.isUser(username, password, table, function(found) {
    if(found) {
      console.log('Found', username, ' in table:', table);
      util.session = true;                                                  //UNCOMMENT
      res.redirect('/');
    } else {
      console.log('Could not find', username, ' in table:', table);
      res.redirect('/login');
    }
  });
*/

app.post('/signup',
function(req, res) {

  var username = req.body.username;
  var password = req.body.password;
  var table = 'users';

  util.encrypt(password, function(hash) {
    util.isUser(username, hash, table, function(found) {
      if(found) {
        console.log('Found', username, ' in table:', table, ' Signup failed.');
        res.redirect('/login');
      } else {
        //encrypt password
        //upon success make a new User and save
         console.log(password, ' hashes to: ', hash);
         new User({
           username: username,
           password: hash
         }).save().then(function() {
           console.log('SignUp Successful.');
           res.redirect('/');
         });
        }
     });
  });
});


/************************************************************/
// Testing the Database
/************************************************************/

// var us = new User({
//           username: 'Raghav',
//           password: 'meatlesspatty',
//         }).save();

// var username = 'Raghav';
// var table = 'users';
// var password = 'meatlesspatty';

// util.isUser(username, password, table, function(found) {
//   if(found) {
//     console.log('Found', username, ' in table:', table);
//   } else {
//     console.log('Could not find', username, ' in table:', table);
//   }
// });

 // var result = db.knex('users')
 //                .where('username', '=', target).then(function(result) {
 //                  console.log('Fetching ',target,':',result[0]['username']);
 //                }).catch(function(err) {
 //                  console.log('Error Fetching',target);
 //                });

// console.log('Fetching Raghav:',result);

/************************************************************/
// Testing the Encryption
/************************************************************/
// var bcrypt = require('bcrypt');
// var password = 'meatlesspatty';
// // var code;
// util.encrypt(password, function(hash){
//   console.log(password, ' hashes to: ',hash);
//   code = hash;
// });
// util.encrypt(password, function(hash){
//   console.log(password, ' hashes to: ',hash);
//   code = hash;
// });

// bcrypt.compare(password, code, function(err, res) {
//   if(res) { console.log(code,' mapped to', password); }
// });


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
