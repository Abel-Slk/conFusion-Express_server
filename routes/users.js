var express = require('express');
const cors = require('./cors');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');

var router = express.Router();
router.use(bodyParser.json()); 

router.options('*', 
  cors.corsWithOptions, 
  (req, res) => {
    res.sendStatus(200); 
  }
);

/* GET users' listing */
router.get('/', 
  cors.corsWithOptions, 
// we'll allow to GET users' listing only to admins - so we'll insert the following middleware to first check that the user is a valid and logged in user and then we check that he's also an admin:
  authenticate.verifyUser, 
  (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
  (req, res, next) => {
    User.find({})
    .then(users => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(users);
        },
        err => next(err)
    )
    .catch(err => next(err));
  }
);

router.post('/signup',
  cors.corsWithOptions, 
  (req, res, next) => { 
    User.register( // here we expect the username and password to be included in the request body:
      new User({ username: req.body.username }), 
      req.body.password, // will be turned into the hash and salt by passport-local-mongoose
      (err, user) => { 
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({ err: err }); 
        }
        else { // if no err and the user gets successfully registered, we set the first and last name:
          if (req.body.firstname) 
            user.firstname = req.body.firstname;
          if (req.body.lastname)
            user.lastname = req.body.lastname;
          user.save((err, user) => { 
            if (err) { 
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.json({ err: err });
              return;
            }
            passport.authenticate('local')(req, res, () => { 
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json({ success: true, status: 'Registration Successful!' }); // when this json is received, the client can simply extract the success property to quickly check if the registration was successful 
            }); 
          });
        }
      }
    );
});

router.post('/login', 
  cors.corsWithOptions, 
  // passport.authenticate('local'), // earlier we had it here. if the user didn't pass this authentication, it simply returned 'unauthorized' in the reply message. that may not be very meaningful for the client side, so we'll enhance this POST method so that authentication will return more meaningful info. for this will place local authentication inside the callback that comes next:
  (req, res, next) => {

    passport.authenticate('local', (err, user, info) => { // passport.authenticate('local') can take an additional callback as the second param. if authentication error occurs, passport.authenticate() can be made to return the error value. if there is no error it will return the user and info with additional info. The error obj will be returned when there is a genuine error ("technical"). But if ex the user doesn't exist, that is not counted as an error - Instead it'll be counted just as user doesn't exist and that information will be stored in the info object
      if (err) 
        return next(err);

      if (!user) { // this will occur if either the username or the password is incorrect (such user doesn't exist). we distinguish between the situation where a genuine error occurs during the authentication process as opposed to the situation where the username or the password is invalid
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: false, status: 'Login unsuccessful', err: info }); // as the error we'll return the info that we obtain if the user is not authenticated
      }
      // otherwise, if authentication is successful, passport.authenticate we'll add this method called req.logIn():
      req.logIn(user, // here we just pass in the user object that we've obtained - cause if we reach this point, then the user object is not null and there's no error. so the user can be logged in
        err => { 
          if (err) { // if there's some genuine (technical) error
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, status: 'Login unsuccessful', err: 'Could not log in the user' });
          }

          // if we reach this point, then the user has successfully logged in, and so we can now generate a token:
          var token = authenticate.getToken({ _id: req.user._id }); // we pass in a payload, which in this case only contains the _id prop of the user. We don't need to include any other parts of the user's info. The user ID is enough to search for the user in the MongoDB 
          // req.user will be already present, because when passport.authenticate('local') above successfully authenticates the user, it'll load req.user onto the request message
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({ success: true, status: 'Login successful', token: token });
        }
      );
    }) (req, res, next); 

  }
);

router.get('/logout', (req, res) => {
  if (req.session) { // if the session exists (and it should - otherwise you're trying to log out a user that has not logged in)
    req.session.destroy(); // destroy the session and remove FROM THE SERVER SIDE the information pertaining to this session
    res.clearCookie('session-id'); // in the reply message we are asking the client to remove the cookie named 'session-id' FROM THE CLIENT SIDE
    res.redirect('/'); 
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403; 
    next(err);
  }
});

router.get('/facebook/token', 
  passport.authenticate('facebook-token'), 
  (req, res) => {
    if (req.user) { // when we call passport.authenticate with the facebook-token strategy, if it is successful, it loads the user into the req object
      var token = authenticate.getToken({ _id: req.user._id }); 

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: true, token: token, status: 'You are successfully logged in!' });
    }
}); 

router.get('/checkJWTToken', // It is quite possible that while the client has logged in and obtained the JSON Web Token, sometime later the JSON Web Token may expire. So if the user tries to access from the client side with an expired token, the server will not be able to authenticate the user. So at periodic intervals we may wish to cross-check to make sure that the JSON Web Token is still valid
  cors.corsWithOptions, 
  (req, res) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => { 
      if (err)
        return next(err);
      
      if (!user) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        return res.json({ status: 'JWT invalid!', success: false, err: info }); 
      }
      else { // if the user is a valid user
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.json({ status: 'JWT valid!', success: true, user: user }); 
      }
    }) (req, res); 
}) 

module.exports = router;
