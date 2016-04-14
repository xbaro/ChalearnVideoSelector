var express = require('express');
var router = express.Router();
//var forceSSL = require('express-force-ssl'); 
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var Model = require('../model');

var DB = require('../db');

/* Methods for authentication */
router.get('/signin', function (req, res, next) {
    if (req.isAuthenticated())
        res.redirect('/');
    if (req.secure) {        
        res.render('signin', { title: 'Sign In' });
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + req.headers.host + req.originalUrl);
    }
});

router.post('/signin', function (req, res, next) {
    if (req.secure) {
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/auth/signin'
        }, function (err, user, info) {
            if (err) {
                return res.render('signin', { title: 'Sign In', errorMessage: err.message });
            }
            
            if (!user) {
                return res.render('signin', { title: 'Sign In', errorMessage: info.message });
            }
            return req.logIn(user, function (err) {
                if (err) {
                    return res.render('signin', { title: 'Sign In', errorMessage: err.message });
                } else {
                    return res.redirect('/');
                }
            });
        })(req, res, next);
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + req.headers.host + req.originalUrl);
    }
});

router.get('/signup', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        if (req.secure) {
            res.render('signup', { title: 'Sign Up' });
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + req.headers.host + req.originalUrl);
        }
    }
});

router.post('/signup',  function (req, res, next) {
    var user = req.body;
    var usernamePromise = null;
    usernamePromise = new Model.User({ username: user.username }).fetch();
    
    return usernamePromise.then(function (model) {
        if (model) {
            res.render('signup', { title: 'signup', errorMessage: 'username already exists' });
        } else {
            var password = user.password;
            var hash = bcrypt.hashSync(password);
            
            var signUpUser = new Model.User({ username: user.username, password: hash });
            
            signUpUser.save().then(function (model) {
                // sign in the newly registered user
                res.redirect('/auth/signin');
            });
        }
    });
});

router.get('/signout', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        req.logout();
        res.redirect('/');
    }
});

module.exports = router;