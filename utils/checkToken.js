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
