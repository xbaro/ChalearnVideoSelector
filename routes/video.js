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
        res.redirect('/auth/signin');
    } else {
        var videoID = -1;
        var username = req.user.attributes.username;
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        
        var knex = DB.DB.knex;
        
        knex.transaction(function (trx) {
            return trx
            .select('*').from('tblVideos').where(function () {
                this.where('labeler', username).andWhere('labeled', 0)
            }).then(function (video) {
                if (video.length == 0) {
                    return trx.select(knex.raw("count(*) as nvideos")).from('tblVideos').where('labeler', null).then(function (nvideos) {
                        // Get a random displacement
                        rnd=Math.round(Math.random() * (nvideos[0].nvideos-1));
                        return trx.select('*').from('tblVideos').where('labeler', null).limit(1).offset(rnd).update({ labeler: username }).then(function (nrows) {
                            if (nrows == 1) {
                                knex.select('*').from('tblVideos').where(function () {
                                    this.where('labeler', username).andWhere('labeled', 0)
                                }).then(function (video) {
                                    videoID = video[0].videoId;
                                    return trx;
                                })
                            } else {
                                trx.rollback();
                                res.render('allDone', { username: req.user.attributes.username });
                            }
                        })
                    })
                } else {
                    videoID = video[0].videoId;
                    return trx;
                }
            })
        })
        .then(function (video) {
            res.render('video', { videoURL: fullUrl + '/' + videoID, videoID: videoID, username: req.user.attributes.username });
        })
        .catch(function (error) {
            res.render('error', { username: req.user.attributes.username, error: error, message: error.message});
        });
    }
});

/* GET not labeled video. */
router.get('/:videoID', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        var videoID = req.params.videoID;
        
        var videoPathReq = new Model.Config({ key: 'videoPath' }).fetch();
        
        return videoPathReq.then(function (model) {
            if (model) {
                var videoPath = model.attributes.value;
                var videoData = new Model.Video({ videoId: videoID }).fetch();
                return videoData.then(function (model) {
                    if (model) {
                        var file = path.resolve(videoPath, model.attributes.path);
                        var range = req.headers.range;
                        var positions = range.replace(/bytes=/, "").split("-");
                        var start = parseInt(positions[0], 10);
                        
                        fs.stat(file, function (err, stats) {
                            
                            if (!err) {
                                var total = stats.size;
                                var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                                var chunksize = (end - start) + 1;
                                
                                res.writeHead(206, {
                                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                                    "Accept-Ranges": "bytes",
                                    "Content-Length": chunksize,
                                    "Content-Type": "video/mp4"
                                });
                                
                                var stream = fs.createReadStream(file, { start: start, end: end })
                                .on("open", function () {
                                    stream.pipe(res);
                                }).on("error", function (err) {
                                    res.end(err);
                                });
                            }
                        });
                    } else {
                        res.render('error', { message: 'Invalid videoID' , error: {} });
                    }
                });
            } else {
                res.render('error', { message: 'videoPath configuration value not found', error: {} });
            }
        });
    }
});

/* POST new label. */
router.post('/:videoID', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        var videoID = req.params.videoID;
        var username = req.user.attributes.username;
        var label = req.body.label_value;
        
        var knex = DB.DB.knex;
        
        if (label == -5) {
            var videoReq = new Model.Videos().query(function (q) {
                q.where('labeler', username);
                q.orderBy('modified_at', 'DESC');
                q.limit(2);
            }).fetch();
            return videoReq.then(function (model) {
                if (model && model.length==2) {
                    for (var i = 0, len = model.length; i < len; i++) {                         
                        if (model.models[i].attributes.labeled=='1') {
                            model.models[i].attributes.labeled = '0';
                            model.models[i].attributes.label = null;
                        } else {
                            model.models[i].attributes.labeler = null;
                        }
                        model.models[i].save();
                    }
                    res.redirect('/video');
                } else {
                    res.render('error', { message: 'Unexpected number of rows', error: {}});
                }
                return;
            });
        } else {
            if (label > 0) {
                knex.select('*').from('tblVideos').where('labeler', username).andWhere('labeled', 0).update({ label: label, labeled: 1 }).then(function (numRows) {
                    if (numRows == 1) {
                        res.redirect('/video');
                    } else {
                        res.render('error', { message: 'Error updating. NumRows=' + numRows, error: {}});
                    }
                })
            } else {
                knex.select('*').from('tblVideos').where('labeler', username).andWhere('labeled', 0).update({ labeler: null }).then(function (numRows) {
                    if (numRows == 1) {
                        res.redirect('/video');
                    } else {
                        res.render('error', { message: 'Error updating. NumRows=' + numRows, error: {} });
                    }
                })
            }
        }
    }
});



module.exports = router;