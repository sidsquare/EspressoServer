var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/api');
var auth = require('./routes/auth');
var test = require('./routes/test');
var error = require('./routes/error');


var app = express();

app.set('trust proxy', 2)

var PORT= 8081
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/api',api);
app.use('/auth',auth);
app.use('/test',test);
app.use('./error', error);
// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
  var ip =req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
  console.log('Request from IP address:', ip);
  console.log('Request from IP address:', req.ip);
  console.log('Request from IP address:', req.ips);
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
*/
app.listen(PORT, function(){
	console.log('server running on '+PORT);
});

//sinkhole
app.all('*',function(req, res){
  var ip =req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
  console.log('Request from IP address:', ip);
  console.log('Request from IP address:', req.ip);
  console.log('Request from IP address:', req.ips);
  res.send('This is not the reward that you were promised');
})


module.exports = app;
