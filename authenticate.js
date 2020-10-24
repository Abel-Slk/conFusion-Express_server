var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');

var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); 

var FacebookTokenStrategy = require('passport-facebook-token');

var config = require('./config');


exports.local = passport.use(new LocalStrategy(User.authenticate())); 


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) { 
    return jwt.sign(
        user, // payload
        config.secretKey, 
        { expiresIn: 3600*48 } // let it expire in 48 hours
    ); 
};

var opts = {}; // options for my JWT-based strategy
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); 
opts.secretOrKey = config.secretKey;


exports.jwtPassport = passport.use(new JwtStrategy(
    opts, 
    (jwt_payload, done) => { 
        console.log('JWT payload: ', jwt_payload); // will look like this: { _id: '5f7c815145d7311fd0a5bfc5', iat: 1601995135, exp: 1601998735 }
        
        User.findOne({ _id: jwt_payload._id }, 
            (err, user) => { 
                if (err) {
                    return done(err, false); 
                }
                else if (user) {
                    return done(null, user); // error is null
                }
                else {
                    return done(null, false); 
                }

            }
        );
    }
)); 

exports.verifyUser = passport.authenticate('jwt', { session: false }); // verifyUser() calls upon the passport.authenticate() using 'jwt' as the strategy. It uses the token that comes in the authentication header and then verifies the user. So anytime I want to verify the user's authenticity, I can simply call verifyUser(), and that will initiate the call to the passport.authenticate(). If successful, it will allow me to proceed. If it fails, it will return the error message back to the client saying that the user is not authorized. This procedure is very similar to what you have done in users.js where you call passport.authenticate('local')
// The second param, options, has session: false - cause we are not going to  create sessions in this case, we are using token-based authentication

exports.verifyAdmin = (req, next) => { 
    if (req.user.admin) 
        next();
    else {
        let err = new Error('You are not authorized to perform this operation!');
        err.status = 403;
        return next(err);
    }
};

exports.facebookPassport = passport.use(new FacebookTokenStrategy(
    { 
        clientID: config.facebook.clientId,
        clientSecret: config.facebook.clientSecret 
    },
    (accessToken, refreshToken, profile, done) => { 
        User.findOne( // try to find in our database the user that is trying to log in via Facebook - see if this particular Facebook user has logged in earlier - so that the account would already be configured with the facebookId. where do we obtain the facebookId? Notice that we're getting the profile for the user coming in as a param. This profile will carry a lot of info coming from Facebook that we can use in our app
            { facebookId: profile.id }, 
            (err, user) => { 
                if (err) {
                    return done(err, false);
                }
                if (!err && user !== null) { // if the user has already logged in earlier using Facebook, then the user already exists
                    return done(null, user); // then we just pass back that user
                }
                else { // If the user doesn't exist, then we need to create a new user in our database (so here we're pretty much allowing to register on our website using Facebook)
                    user = new User({ username: profile.displayName }); // when we create a new user, we need to pass in the username. the Facebook profile that has returned will have a prop called displayName, and I'm going to use that. And we'll use other props of the profile obj:
                    user.facebookId = profile.id;
                    user.firstname = profile.name.givenName;
                    user.lastname = profile.name.familyName;
                    user.save((err, user) => {
                        if (err) {
                            return done(err, false);
                        }
                        else {
                            return done(null, user);
                        }
                    });
                }
            }
        );
    }
));