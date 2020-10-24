var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');

var passport = require('passport');
var config = require('./config');

const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dishRouter = require('./routes/dishRouter');
var promoRouter = require('./routes/promoRouter');
var leaderRouter = require('./routes/leaderRouter');
var uploadRouter = require('./routes/uploadRouter');
var favoritesRouter = require('./routes/favoritesRouter');
var commentRouter = require('./routes/commentRouter');

const mongoose = require('mongoose');

const url = config.mongoUrl; 
const connect = mongoose.connect(url); 

connect.then(db => {
    console.log('Connected correctly to server');
  },
  err => {
    console.log(err);
  }
);

var app = express();

// I configure this server to redirect any request coming to the unsecure port (3000) to the secure port (3443). to do that, I set up a middleware after app.express():
app.all('*', (req, res, next) => { // for all requests and regardless of the path
  if (req.secure) { 
    return next(); // allow to proceed
  }
  else { // if the request is coming to the insecure port
    res.redirect(307, 'https://' + req.hostname + ':' + app.get('secPort') + req.url); 
    // 307 - the target resource resides temporarily under different URL. in this case the user agent must not change the request method - I'll be expecting the user to retry with the same method.
  }
}); 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());

app.use(cors()); // adding this to app.js solved the cors-related problems for logging in - which was at first prohibited in all browsers (saying "Failed to load resource: Origin http://localhost:3001 is not allowed by Access-Control-Allow-Origin" for https://localhost:3443)

// mounting of endpoints
app.use('/', indexRouter); 
app.use('/users', usersRouter);

app.use(express.static(path.join(__dirname, 'public'))); 

// mounting our custom routes:
app.use('/dishes', dishRouter);
app.use('/promotions', promoRouter);
app.use('/leaders', leaderRouter);
app.use('/imageUpload', uploadRouter);
app.use('/favorites', favoritesRouter);
app.use('/comments', commentRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
