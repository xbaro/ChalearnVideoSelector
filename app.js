var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var forceSSL = require('express-force-ssl');

var routes = require('./routes/index');
var users = require('./routes/video');
var admin = require('./routes/admin');
var auth = require('./routes/auth');

/* BEGIN: Add session and user required modules */
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Model = require('./model');
/* END */

var app = express();

app.set('forceSSLOptions', {
    enable301Redirects: false
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

/* BEGIN: Configure Passport for user authentication */
passport.use(new LocalStrategy(function (username, password, done) {
    new Model.User({ username: username }).fetch().then(function (data) {
        var user = data;
        if (user === null) {
            return done(null, false, { message: 'Invalid username or password' });
        } else {
            user = data.toJSON();
            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false, { message: 'Invalid username or password' });
            } else {
                return done(null, user);
            }
        }
    });
}));

passport.serializeUser(function (user, done) {
    done(null, user.username);
});

passport.deserializeUser(function (username, done) {
    new Model.User({ username: username }).fetch().then(function (user) {
        done(null, user);
    });
});

var dbconfig = require('./db').Config;


var options = {
    host: dbconfig.host,
    port: dbconfig.port,
    user: dbconfig.user, 
    password: dbconfig.password,
    database: dbconfig.database,    
    checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds. 
    expiration: 86400000,// The maximum age of a valid session; milliseconds. 
    createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist. 
    schema: {
        tableName: 'tblSessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

var sessionStore = new MySQLStore(options);
app.use(session({
    secret: 'secret',
    name: 'video_labeler',  
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
 /* END */

app.use('/', routes);
app.use('/video', users);
app.use('/admin', admin);
app.use('/auth', auth);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
