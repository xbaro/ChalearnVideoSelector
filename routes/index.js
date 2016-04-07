var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var Model = require('../model');

var DB = require('../db');

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Chalearn Video Selector', user : req.user });
});

router.get('/stats', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var knex = DB.DB.knex;

        knex.select(knex.raw("labeler, count(*) as total, SUM(labeled = 1) AS TL, SUM(labeled = 0) AS TNL,coalesce(SUM(label ='1') , 0) AS TAccepted, coalesce(SUM(label ='2') , 0) AS TRejected, coalesce(SUM(label ='3') , 0) AS TMicroCuts")).from('tblVideos')        
            .whereNot('labeler', null).groupBy('labeler').orderBy('TL', 'desc').then(function (userData) {
            
            knex.select(knex.raw("count(*) as total, SUM(labeled = 1) AS TL, SUM(labeled = 0) AS TNL, coalesce(SUM(label ='1') , 0) AS TAccepted, coalesce(SUM(label ='2') , 0) AS TRejected, coalesce(SUM(label ='3') , 0) AS TMicroCuts")).from('tblVideos')
            .then(function (videoData) {
                res.render('stats', { title: 'Statistics', username: req.user.attributes.username, videoData: videoData[0], userData: userData });                        
            })
        })       
    }
});

/* Methods for authentication */
router.get('/signin', function (req, res, next) {
    if (req.isAuthenticated()) res.redirect('/');
    res.render('signin', { title: 'Sign In' });
});

router.post('/signin', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/signin'
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
                return res.redirect('/video');
            }
        });
    })(req, res, next);
});

router.get('/signup', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('signup', { title: 'Sign Up' });
    }
});

router.post('/signup', function (req, res, next) {
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
                res.redirect('/signin');
            });
        }
    });
});

router.get('/signout', function (req, res, next) {
    if (!req.isAuthenticated()) {
        notFound404(req, res, next);
    } else {
        req.logout();
        res.redirect('/');
    }
});

module.exports = router;