require("dotenv").config()
const database = {
    connectionLimit : 5,
    host: "localhost",
    user: "root",
    database: process.env.database,
    password: process.env.password
}

module.exports = database;