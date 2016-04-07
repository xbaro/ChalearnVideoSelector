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
  `path` varchar(512) DEFAULT NULL,  
  `labeler` varchar(100), 
  `labeled` boolean not null default 0,
  `label` char(1) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `modified_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`videoId`)      
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
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