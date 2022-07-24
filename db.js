require('dotenv').config();
var mysql = require('mysql');

var option = {
    host: process.env.DB_HOST,
    post: process.env.DB_SERVER_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: 'date',
    charset: 'utf8mb4',
};

var connection = mysql.createConnection(option);


module.exports = connection;
module.exports.connAccount = option;
