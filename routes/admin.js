var express = require('express');
var router = express.Router();

var fs = require('fs'),    
    url = require('url'),
    path = require('path');
var Model = require('../model');
var DB = require('../db');

/* GET not labeled video. */
router.get('/', function (req, res) {    
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {}});
        } else {
            res.render('admin', { user: req.user});
        }        
    }
});

/* POST key value. */
router.post('/set/:key', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var key = req.params.key;
            var value = req.body.value;
            
            var confModel = new Model.Config({ key: key, value: value });
            confModel.save().then(function (model) {
                if (!model) {
                    res.render('error', { message: 'Error modifying key ' + key + ' with value ' + value, error: {} });
                } else {
                    res.render('admin', { user: req.user, message: "Value changed" });
                }
            });
        }
    }    
});

/* GET . */
router.post('/resetDB', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var knex = DB.DB.knex;
            knex('tblvideos').del().then(function (numRows) {
                res.render('admin', { user: req.user, message: "Reset performed. " + numRows + " rows deleted." });
            });
        }
    }
});

/* GET . */
router.post('/load', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var videoPathReq = new Model.Config({ key: 'videoPath' }).fetch();                    
            return videoPathReq.then(function (model) {
                if (model) {
                    var videoPath = model.attributes.value;
                    fs.lstat(videoPath, function (err, stats) {
                        if (!err && stats.isDirectory()) {
                            var videos = fs.readdirSync(videoPath);
                            for (var i = 0, len = videos.length; i < len; i++) {
                                var videoModel = new Model.Video({ path: videos[i] });
                                videoModel.save().then(function (model) {
                                    if (!model) {
                                        res.render('error', { message: 'Error adding file: ' + video, error: {} });
                                    }
                                });
                            }
                            res.render('admin', { user: req.user, message: videos.length + " videos loaded" });
                        } else {
                            res.render('error', { message: 'videoPath configuration value is incorrect', error: {} });
                        }
                    });                    
                } else {
                    res.render('error', { message: 'videoPath configuration value not found', error: {} });
                }
            });
        }
    }
});

module.exports = router;