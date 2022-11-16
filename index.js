const express = require("express");
const fs = require('fs');
const path = require('path')
const db = require("./database/config")

const jwt = require('jsonwebtoken');
const multer = require('multer')
const app = express();
const mysql = require("mysql2");
const cors = require("cors")

const bodyParser = require("body-parser");
// const { resolve } = require("path");
// const { rejects } = require("assert");
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
app.use(bodyParser.urlencoded({ extended: true }))
app.use(checkToken)


function generateAccessToken(username, surname, email) {
    return jwt.sign(username + surname + email, process.env.TOKEN_SECRET);
}

// router.post("/photo", upload.single('test'), (req, res) => {
//     res.json({ message: "Successfully uploaded files" });
// })


// =========== registration =============
router.post("/registration", (req, res) => {
    if (!req.body) return res.sendStatus(400);

    connection.query("Select * from authors where Email = ?",
        [req.body.email], function (err, result) {
            if (err) res.sendStatus(400).json({ message: result })
            console.log(result);
            if (result.length === 0) {
                const token = generateAccessToken(req.body.name);
                connection.query("insert into authors (Name,Surname,Phone,Email,Password, Token) values (? , ?, ? , ?, ?, ? ) ",
                    [req.body.name, req.body.surname, req.body.phone, req.body.email, req.body.password, token], function (err, result) {
                        if (err) res.sendStatus(400).json({ message: result })
                        else res.status(200).json({ message: "Success", token: token })
                    })
            } else {
                res.json("Пользователь с такой же почтой уже существует")
            }
        })
})

router.post("/login", (req, res) => {
    connection.query("Select Token from authors where Email = ? and Password = ?", [req.body.email, req.body.password],
        function (err, result) {
            console.log(result)
            if (err) res.sendStatus(400).json({ message: result })
            else res.status(200).json({ message: "Success", token: result[0].Token })
        })
})


// Апи по новостям
router.post("/addPost", upload.single('image'), (req, res) => {
    if (!req.body) return res.sendStatus(400);
    console.log(req.file.filename, req.body)
    connection.query("insert articles(Title, Article_text, Author_id, Image, created_at) values (?, ?, ?, ?, ?)",
        [req.body.title, req.body.text, +req.body.id, "uploads\\" + req.file.filename, new Date().toISOString().split('T')[0]], function (err, result) {
            if (err) res.json(err)
            res.json("cool")
        })
})

router.get("/myArticles/:id", async (req, res) => {
    // router.get("/myArticles", async (req, res) => {

    // const header = req.headers["authorization"]
    // const baerer = header.split(" ");
    // const baererToken = baerer[1];

    // let data = new Promise((resolve, rejects) => {
    //     connection.query("SELECT * FROM authors where token = ?", [baererToken], function (err, result) {
    //         if (err) rejects(err)
    //         else resolve(result)
    //     })
    // })

    // let dataFromDb = await data;


    // connection.query("SELECT * FROM articles where Author_id = ? ", [dataFromDb[0].Id],
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

router.get("/getArticle/:id", (req, res) => {
    connection.query("SELECT * FROM articles where Article_id = ?", [req.params.id],
        function (err, result, fields) {
            if (err) res.sendStatus(400).json({ message: result })
            res.json({ data: result })

        });
})

router.get("/findArticle", (req, res) => {
    connection.query("select * from articles where Title LIKE ?", ['%' + req.body.text + '%'],
        function (err, result, fields) {
            if (err) res.sendStatus(400).json({ message: result })
            res.json({ data: result })
        });
})

// Моя инфа
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

router.post("/profilePhoto", upload.single('image'), (req, res) => {
    const header = req.headers["authorization"]
    const baerer = header.split(" ");
    const baererToken = baerer[1];
    connection.query("update authors set ProfileImage = ? where Token = ?", ["uploads\\" + req.file.filename, baererToken],
        function (err, result) {
            if (err) res.sendStatus(400).json({ message: result })
            else res.status(200).json("Данные измененный")
        })
    // connection.query("insert authors (ProfileImage) values (?) where Token = ?", ["uploads\\" + req.file.filename, baererToken],
    //     function (err, result) {
    //         if (err) res.sendStatus(400).json({ message: result })
    //         else res.status(200).json("Данные измененный")
    //     })
})


router.put("/updateUser", checkToken, async (req, res) => {
    const header = req.headers["authorization"]
    const baerer = header.split(" ");
    const baererToken = baerer[1];

    let data = new Promise((resolve, rejects) => {
        connection.query("SELECT * FROM authors where token = ?", [baererToken], function (err, result) {
            if (err) rejects(err)
            else resolve(result)
        })
    })

    let dataFromDb = await data;
    console.log(req.body);
    let inputData = [
        req.body.phone.length === 0 ? dataFromDb[0].Phone : req.body.phone,
        req.body.name.length === 0 ? dataFromDb[0].Name : req.body.name,
        req.body.surname.length === 0 ? dataFromDb[0].Surname : req.body.surname,
        req.body.email.length === 0 ? dataFromDb[0].Email : req.body.email,
        req.body.password.length === 0 ? dataFromDb[0].Password : req.body.password,
        // Object.keys(req.body.phone).length === 0 ? dataFromDb[0].Phone : req.body.phone,
        // Object.keys(req.body.name).length === 0 ? dataFromDb[0].Name : req.body.name,
        // Object.keys(req.body.surname).length === 0 ? dataFromDb[0].Surname : req.body.surname,
        // Object.keys(req.body.email).length === 0 ? dataFromDb[0].Email : req.body.email,
        // Object.keys(req.body.password).length === 0 ? dataFromDb[0].Password : req.body.password,
        baererToken
    ]

    // console.log(dataFromDb);

    connection.query("update authors set Phone = ?, Name = ?, Surname = ?, Email = ?, Password = ? where Token = ? ",
        inputData, function (err, result) {
            if (err) res.sendStatus(400).json({ message: result })
            else {
                connection.query("SELECT * FROM authors where token = " + mysql.escape(baererToken),
                    function (err, result, fields) {
                        if (err) res.sendStatus(400).json({ message: result })
                        res.json({ data: { user: result[0] } })
                    });
            }
            // res.json("Данные измененный")
        })
})
//'eyJhbGciOiJIUzI1NiJ9.QWJsYXl1bmRlZmluZWR1bmRlZmluZWQ.8AFIGJi_1OqXzeIk6Ot0r1U0mIiZaAF198qWTbz47ws'

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