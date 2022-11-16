require("dotenv").config()
const database = {
    connectionLimit: 5,
    host: "localhost",
    user: "root",
    database: process.env.database,
    password: process.env.password
}

// const database = {
//     connectionLimit : 5,
//     host: "eu-cdbr-west-03.cleardb.net",
//     user: "b7c0da7e1552be",
//     database: "heroku_a9670a7361fd7b6",
//     password: "c5df94d4"
// }


module.exports = database;
//mysql://b7c0da7e1552be:c5df94d4@eu-cdbr-west-03.cleardb.net/heroku_a9670a7361fd7b6?reconnect=true