﻿var express = require('express');
var router = express.Router();

var fs = require('fs-extra'),    
    url = require('url'),
    path = require('path');
var Model = require('../model');
var DB = require('../db');


var exportFile = function (inFile, outFile, videoID) {
    fs.copy(inFile, outFile, function (err) {
        if (err) {
            console.error(err)
        } else {
            // Update export flag
            var expVideoModel = new Model.Video({ videoId: videoID, exported: '1' });
            expVideoModel.save().then(function (model) {
                if (!model) {
                    console.error('Error updating exportation flag of video ' + videoID);
                }
            });
        }
    });         
}

/* GET not labeled video. */
router.get('/', function (req, res) {    
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
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
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var key = req.params.key;
            var value = req.body.value;
            var confModel = new Model.Config({ key: key, value: value });
            
            var confModelPromise = new Model.Config({ key: key}).fetch();
            return confModelPromise.then(function (model) {
                if (model) {
                    // Update an existing parameter
                   
                    confModel.save().then(function (model) {
                        if (!model) {
                            res.render('error', { message: 'Error modifying key ' + key + ' with value ' + value, error: {} });
                        } else {
                            res.render('admin', { user: req.user, message: "Value changed" });
                        }
                    });                    
                } else {
                    // Create a new register                    
                    confModel.save(null, { method: 'insert' }).then(function (model) {
                        if (!model) {
                            res.render('error', { message: 'Error modifying key ' + key + ' with value ' + value, error: {} });
                        } else {
                            res.render('admin', { user: req.user, message: "Value changed" });
                        }
                    });                    
                }
            });            
        }
    }    
});

/* GET . */
router.post('/resetDB', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var knex = DB.DB.knex;
            knex('tblVideos').del().then(function (numRows) {
                res.render('admin', { user: req.user, message: "Reset performed. " + numRows + " rows deleted." });
            });
        }
    }
});

/* GET . */
router.post('/load', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var videoPathReq = new Model.Config({ key: 'videoPath' }).fetch();                    
            return videoPathReq.then(function (model) {
                if (model) {                    
                    // Add the new videos
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
                                }).catch(function (err) {
                                    // Video already exists, we do nothing.                                        
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

/* GET . */
router.post('/backup', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var backupPathReq = new Model.Config({ key: 'backupPath' }).fetch();
            return backupPathReq.then(function (model) {
                if (model) {
                    var backupPath = model.attributes.value;
                    try {
                        fs.ensureDirSync(backupPath);
                    } catch (err) {
                        res.render('admin', { user: req.user, message: 'Cannot create backup dir' });
                    }
                    var moment = require('moment');
                    var filename = path.resolve(backupPath, moment().format('YYYYMMDD_HHmmss') + '.sql'); 
                        var mysqlDump = require('mysqldump');                        
                        var dbconfig = DB.Config;                        
                        mysqlDump({
                            host: dbconfig.host,
                            user: dbconfig.user,
                            password: dbconfig.password,
                            database: dbconfig.database,
                            dest: filename
                        }, function (err) {
                            if (err) {
                                res.render('error', { message: err, error: {} });
                            } else {
                                res.render('admin', { user: req.user, message: 'backup file created at ' + filename });
                            }                        
                        })
                    }
                
                });
         }
    }
});


/* GET . */
router.post('/export', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var videoPathReq = new Model.Config({ key: 'videoPath' }).fetch();
            return videoPathReq.then(function (model) {
                if (model) {
                    var videoPath = model.attributes.value;
                    var exportPathReq = new Model.Config({ key: 'exportPath' }).fetch();
                    return exportPathReq.then(function (model) {
                        if (model) {
                            var exportPath = model.attributes.value;
                            var labelTag = ['Error', 'Valid', 'NoValid', 'ValidCuts'];
                            try {
                                fs.ensureDirSync(exportPath);
                                for (var i = 0, len = labelTag.length; i < len; i++) {
                                    fs.ensureDirSync(path.resolve(exportPath, labelTag[i]));
                                }       
                            } catch (err) {
                                res.render('admin', { user: req.user, message: 'Cannot create export dir' });
                            }
                            
                            var videoReq = new Model.Videos().query({ where: { exported: '0', labeled: '1' } }).fetch();
                            return videoReq.then(function (model) {                                
                                if (model) {                                    
                                    for (var i = 0, len = model.length; i < len; i++) {
                                        var inFile = path.resolve(videoPath, model.models[i].attributes.path);                                        
                                        var outFile = path.resolve(path.resolve(exportPath, labelTag[model.models[i].attributes.label]), model.models[i].attributes.path);
                                        var videoID = model.models[i].attributes.videoId;
                                        exportFile(inFile, outFile, videoID);                             
                                    }
                                    res.render('admin', { user: req.user, message: model.length + ' videos will be exported.'});
                                } else {
                                    res.render('admin', { user: req.user, message: 'No remaining labeled videos to export' });
                                }
                            });
                        } else {
                            res.render('admin', { user: req.user, message: 'Export path is not defined' });
                        }
                    });
                } else {
                    res.render('admin', { user: req.user, message: 'Video path is not defined' });
                }
            });
        }
    }
});

module.exports = router;