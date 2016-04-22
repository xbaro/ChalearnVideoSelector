var fs = require('fs-extra'),    
    url = require('url'),
    path = require('path');
var Model = require('./model');
var DB = require('./db');

var videoPath = '/data/hupba/Datasets/YoutubeMonk/outputs/clips';
var exportPath = './export_last';

var labelTag = ['Error', 'Valid', 'NoValid', 'ValidCuts'];
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
                return;
            });
        }
    });
    return;
}


try {
    fs.ensureDirSync(exportPath);
    for (var i = 0, len = labelTag.length; i < len; i++) {
        fs.ensureDirSync(path.resolve(exportPath, labelTag[i]));
    }
} catch (err) {
    console.error('There was an error creating output files!', err);
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
        console.log(model.length + ' videos will be exported.');
    } else {
        console.error('No remaining labeled videos to export', {});        
    }
    return;
});

