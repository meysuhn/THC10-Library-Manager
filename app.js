/* eslint-disable */

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// I've added these to import the route files. They are 'use(d)' further below.
var patronsRouter = require('./routes/patrons'); // import the patrons routes file (the counterpart to module.exports = router;)
var booksRouter = require('./routes/books');
var loansRouter = require('./routes/loans');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Mounting Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// the first two were automatically added via the generator
app.use('/', indexRouter);
app.use('/users', usersRouter);
// These I added to add the routes to the app.
// These are associated with the 3 file require statements at the top.
app.use(booksRouter);
app.use(patronsRouter);
app.use(loansRouter);


//////////////////////
// I've added these as per MDN tutorial. They crash my app you idiot.
// app.use('/books', booksRouter);
// app.use('/loans', loansRouter);
// app.use('/patrons', patronsRouter);
//////////////////////

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
