require("dotenv").config()
// const database = {
//     connectionLimit : 5,
//     host: "localhost",
//     user: "root",
//     database: process.env.database,
//     password: process.env.password
// }

const database = {
    connectionLimit : 5,
    host: "eu-cdbr-west-03.cleardb.net",
    user: "b8d604b2ceecc7",
    database: "f01df002",
    password: "heroku_af7788d9651187b"
}


module.exports = database;

// mysql://b8d604b2ceecc7:f01df002@eu-cdbr-west-03.cleardb.net/heroku_af7788d9651187b?reconnect=true