const express = require("express");
const fs = require('fs');
const path = require('path')
const db = require("./database/config")

const jwt = require('jsonwebtoken');
const multer = require('multer')
const app = express();
const mysql = require("mysql2");
const cors = require("cors")

const bodyParser = require("body-parser")
const connection = mysql.createPool(db);

const router = express.Router();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "--" + file.originalname)
    }
})

const upload = multer({ storage: fileStorage })

app.use(express.json());
app.use(cors());
app.use(router);
// app.use(bodyParser.urlencoded({ extended: true }))

function checkToken(req, res, next) {
    const header = req.headers["authorization"]
    if (typeof header !== "undefined") {
        const baerer = header.split(" ");
        const baererToken = baerer[1];

        connection.query("SELECT * FROM authors where Token = ?", baererToken,
            function (err, results, fields) {
                if (err) res.sendStatus(400).json({ message: results })
                else next()
            });
    } else {
        res.json({ message: "Нет токена" })
    }
}



app.use('/uploads', express.static('./uploads'));
// app.use(bodyParser.urlencoded({ extended: true }))
// app.use(checkToken)


function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET);
}

// router.post("/photo", upload.single('test'), (req, res) => {
//     res.json({ message: "Successfully uploaded files" });
// })



router.post("/registration", (req, res) => {
    if (!req.body) return res.sendStatus(400);
    const token = generateAccessToken(req.body.name);
    connection.query("insert into authors (Name,Surname,Phone,Email,Password, Token) values (? , ?, ? , ?, ?, ? ) ",
        [req.body.name, req.body.surname, req.body.phone, req.body.email, req.body.password, token], function (err, result) {
            if (err) res.sendStatus(400).json({ message: result })
            else res.status(200).json({ message: "Success", token: token })
        })
})

router.post("/addPost", upload.single('image'), (req, res) => {
    if (!req.body) return res.sendStatus(400);
    console.log(req.file.filename, req.body)
    connection.query("insert articles(Title, Article_text, Author_id, Image ) values (?, ?, ?, ?)",
        [req.body.title, req.body.text, 1, "uploads\\" + req.file.filename], function (err, result) {
            if (err) res.json(err)
            res.json("cool")
        })
})

// router.post("/addPost", checkToken, (req, res) => {
//     const header = req.headers["authorization"]
//     const baerer = header.split(" ");
//     const baererToken = baerer[1];
//     connection.query("insert articles(Title, Article_text, Author_id, Image ) values (?, ?, ?, ?)",
//         [req.body.title, req.body.text, req.body.authorId, upload.single(req.body.image)], function (err, result) {

//         })
// })

router.post("/login", (req, res) => {
    connection.query("Select Token from authors where Email = ? and Password = ?", [req.body.email, req.body.password],
        function (err, result) {
            console.log(result)
            if (err) res.sendStatus(400).json({ message: result })
            else res.status(200).json({ message: "Success", token: result[0].Token })
        })
})


router.get("/user", checkToken, (req, res) => {
    const header = req.headers["authorization"]
    const baerer = header.split(" ");
    const baererToken = baerer[1];
    connection.query("SELECT * FROM authors where token = " + mysql.escape(baererToken),
        function (err, result, fields) {
            if (err) res.sendStatus(400).json({ message: result })
            res.json({ data: { user: result[0] } })
        });
})

router.get("/myArticles/:id", (req, res) => {
    connection.query("SELECT * FROM articles where Author_id = ? ", [req.params.id],
        function (err, result, fields) {
            if (err) res.sendStatus(400).json({ message: "result" })
            res.json({ data: result })
        });
})

router.get("/articles", (req, res) => {
    connection.query("SELECT * FROM articles ",
        function (err, result, fields) {
            if (err) res.sendStatus(400).json({ message: result })
            res.json({ data: result })
        });
})

router.get("/", checkToken, (req, res) => {
    connection.query("SELECT * FROM authors",
        function (err, result, fields) {
            if (err) res.sendStatus(400).json({ message: result })
            res.json({ data: results })
        });
})


app.listen(process.env.PORT, () => {
    console.log("Server is started");
})