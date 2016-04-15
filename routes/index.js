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
        res.render('stats', { title: 'Statistics', user : req.user });
    }
});

module.exports = router;