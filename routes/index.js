const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const fs = require("fs");
const db = require("../common/db");
const utils = require("../common/utils");
const moment = require("moment");

async function setLog(req, res, next) {
    const ip = req.sessionID;
    var rows;
    await new Promise(function (resolve, reject) {
        var sql = `SELECT visit FROM ANALYZER_tbl WHERE ip = ? ORDER BY idx DESC LIMIT 0, 1`;
        db.query(sql, ip, function (err, rows, fields) {
            if (!err) {
                resolve(rows);
            }
        });
    }).then(function (data) {
        rows = data;
    });

    await new Promise(function (resolve, reject) {
        var sql = `INSERT INTO ANALYZER_tbl SET ip = ?, agent = ?, visit = ?, created = NOW()`;
        if (rows.length > 0) {
            var cnt = rows[0].visit + 1;
            db.query(sql, [ip, req.headers["user-agent"], cnt], function (err, rows, fields) {
                resolve(cnt);
            });
        } else {
            db.query(sql, [ip, req.headers["user-agent"], 1], function (err, rows, fields) {
                resolve(1);
            });
        }
    }).then(function (data) {
        console.log(data);
    });

    //현재 접속자 파일 생성
    var memo = new Date().getTime() + "|S|" + req.baseUrl + req.path;
    fs.writeFile("./liveuser/" + ip, memo, function (err) {
        console.log(memo);
    });
    //
    next();
}

router.get("/", function (req, res, next) {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    res.render("index", {
        title: "Eyedoc Api",
        session: `${ip}`,
        mode: process.env.NODE_ENV,
    });
});

router.post("/post", function (req, res, next) {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    res.send({
        id: req.body.id,
        name: req.body.name,
        title: "Eyedoc Api",
        session: `${ip}`,
        mode: process.env.NODE_ENV,
    });
});


router.get("/stt", function (req, res, next) {
    console.log("stt");
    res.render("stt.html", {
        mode: process.env.NODE_ENV,
    });
});

router.get('/push_test', async function(req, res, next) {
    const id = req.query.id;
    const result = utils.sendPush(id, '푸시테스트 바디 입니다.');
    res.json(result);
});

module.exports = router;
