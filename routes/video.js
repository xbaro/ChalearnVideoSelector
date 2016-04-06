var express = require('express');
var router = express.Router();

var fs = require('fs'),    
    url = require('url'),
    path = require('path');
var Model = require('../model');
var DB = require('../db');

var videoPath = "C:\\Users\\Xavier\\Desktop\\Programacio\\FP\\videos";

/* GET not labeled video. */
router.get('/', function (req, res) {    
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var videoID = -1;
        var username = req.user.attributes.username;
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        
        var knex = DB.DB.knex;
        
        knex.transaction(function (trx) {
            return trx
            .select('*').from('tblvideos').where(function () {
                this.where('labeler', username).andWhere('labeled', 0)
            }).then(function (video) {
                if (video.length == 0) {
                    return trx.select(knex.raw("count(*) as nvideos")).from('tblvideos').where('labeler', null).then(function (nvideos) {
                        // Get a random displacement
                        rnd=Math.round(Math.random() * (nvideos[0].nvideos-1));
                        return trx.select('*').from('tblvideos').where('labeler', null).limit(1).offset(rnd).update({ labeler: username }).then(function (nrows) {
                            if (nrows == 1) {
                                knex.select('*').from('tblvideos').where(function () {
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
    
    var videoID = req.params.videoID;
    
    var videoData = new Model.Video({ videoId: videoID }).fetch();
    
    return videoData.then(function (model) {        
        if (model) {
            var file = path.resolve(videoPath, model.attributes.path);
            var range = req.headers.range;
            var positions = range.replace(/bytes=/, "").split("-");
            var start = parseInt(positions[0], 10);
            
            fs.stat(file, function (err, stats) {
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
            });
        }
    });
});

/* POST new label. */
router.post('/:videoID', function (req, res) {
    var videoID = req.params.videoID;
    var username = req.user.attributes.username;
    var label = req.body.label_value;
    
    var knex = DB.DB.knex;
    
    if (label > 0) {
        knex.select('*').from('tblvideos').where('labeler', username).andWhere('labeled', 0).update({ label: label, labeled: 1 }).then(function (numRows) {
            if (numRows == 1) {
                res.redirect('/video');
            } else {
                res.render('error', { message: 'Error updating. NumRows=' + numRows });
            }
        })
    } else {
        knex.select('*').from('tblvideos').where('labeler', username).andWhere('labeled', 0).update({labeler: null}).then(function (numRows) {
            if (numRows == 1) {
                res.redirect('/video');
            } else {
                res.render('error', { message: 'Error updating. NumRows=' + numRows });
            }
        })
    }
});

module.exports = router;