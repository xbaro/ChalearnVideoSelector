var Bookshelf = require('bookshelf');

var config = {
    host: 'localhost',  // your host
    port: 3306, // your port
    user: 'video_labeler', // your database user
    password: '.video_labeler.', // your database password
    database: 'video_labeler',
    charset: 'UTF8_GENERAL_CI'
};

var knex = require('knex')({
    client: 'mysql',
    connection: config
});

var DB = require('bookshelf')(knex);

module.exports.Config = config;
module.exports.DB = DB;