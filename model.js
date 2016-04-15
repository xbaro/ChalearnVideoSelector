var DB = require('./db').DB;

/*
CREATE TABLE `tblUsers` (
  `userId` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `admin` boolean not null default 0,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
*/ 
var User = DB.Model.extend({
    tableName: 'tblUsers',
    idAttribute: 'userId'
});

/*
CREATE TABLE `tblSessions` (
  `session_id` varchar(255) COLLATE utf8_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text COLLATE utf8_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
*/
var Session = DB.Model.extend({    
    tableName: 'tblSessions',
    idAttribute: 'session_id'            
});


/*
 CREATE TABLE `tblVideos` (
  `videoId` int(11) NOT NULL AUTO_INCREMENT,
  `path` varchar(200) NOT NULL,
  `labeler` varchar(100) DEFAULT NULL,
  `labeled` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `modified_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `label` char(1) DEFAULT NULL,
  PRIMARY KEY (`videoId`),
  UNIQUE KEY `path_UNIQUE` (`path`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8;

 */
var Video = DB.Model.extend({
    tableName: 'tblVideos',
    idAttribute: 'videoId'
});


/*
 CREATE TABLE `tblConfig` (   
  `key` varchar(50) not null,  
  `value` varchar(512) not null,    
  PRIMARY KEY (`key`)      
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
 */
var Config = DB.Model.extend({
    tableName: 'tblConfig',
    idAttribute: 'key'
});

module.exports = {
    User: User,
    Session: Session,
    Video: Video,
    Config: Config
};