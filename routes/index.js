var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var Model = require('../model');

var DB = require('../db');

/* GET home page. */
router.get('/', function (req, res) {
    if (req.secure) {
        // request was via https, so redirect to http
        res.redirect('http://' + req.headers.host + req.originalUrl);
    } else {
        res.render('index', { title: 'Chalearn Video Selector', user : req.user });        
    }    
});

router.get('/stats', function (req, res) {
    if (req.secure) {
        // request was via https, so redirect to http
        res.redirect('http://' + req.headers.host + req.originalUrl);
    } else {
        if (!req.isAuthenticated()) {
            res.redirect('/auth/signin');
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
    }
});

module.exports = router;