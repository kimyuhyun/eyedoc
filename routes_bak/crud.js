const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const fs = require("fs");
const multer = require("multer");
const uniqid = require("uniqid");
const db = require("../db");
const utils = require("../Utils");
const FormData = require("form-data");
const axios = require("axios");
const { log } = require("console");

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            var date = new Date();
            var month = eval(date.getMonth() + 1);
            if (eval(date.getMonth() + 1) < 10) {
                month = "0" + eval(date.getMonth() + 1);
            }
            var dir = "data/" + date.getFullYear() + "" + month;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            cb(null, dir);
        },
        filename: function (req, file, cb) {
            var tmp = file.originalname.split(".");
            var mimeType = tmp[tmp.length - 1];
            if ("php|phtm|htm|cgi|pl|exe|jsp|asp|inc".includes(mimeType)) {
                mimeType = mimeType + "x";
            }
            cb(null, uniqid(file.filename) + "." + mimeType);
        },
    }),
});

function userChecking(req, res, next) {
    //여기서 토큰 체크!

    //
    next();
}


router.get("/write", userChecking, async function (req, res, next) {
    const { idx, table } = req.query;

    var row = {};

    if (idx) {
        const sql = `SELECT * FROM ?? WHERE idx = ?`;
        const arr = await utils.queryResult(sql, [table, idx]);
        row = arr[0];
    }
    res.send(row);
});

router.post("/write", userChecking, async function (req, res, next) {
    const table = req.body.table;
    const id = req.body.id;
    const idx = req.body.idx;

    delete req.body.idx;
    // delete req.body.id;
    delete req.body.table;
    delete req.body.created;
    delete req.body.modified;

    var isDateColnumn = true;

    //날짜 컬럼이 있는지 확인!
    var sql = `SHOW COLUMNS FROM ?? LIKE 'created'`;
    var arr = await utils.queryResult(sql, [table]);
    if (!arr[0]) {
        isDateColnumn = false;
    }

    sql = "";
    var records = [];
    records.push(table);

    for (key in req.body) {
        if (req.body[key] != "null") {
            if (key == "pass1") {
                if (req.body[key]) {
                    sql += key + "= PASSWORD(?), ";
                    records.push(req.body[key]);
                }
            } else {
                if (req.body[key]) {
                    sql += key + "= ?, ";
                    records.push(req.body[key]);
                }
            }
        }
    }

    if (idx) {
        records.push(idx);
        if (isDateColnumn) {
            sql = `UPDATE ?? SET ${sql} modified = NOW() WHERE idx = ?`;
        } else {
            sql = `UPDATE ?? SET ${sql.slice(0, -2)}  WHERE idx = ?`;
        }

        //1:1문의면 푸시 날리기!!
        if (req.body.board_id == "cscenter") {
            sql = `SELECT id FROM BOARD_tbl WHERE idx = ?`;
            arr = await utils.queryResult(sql, [idx]);
            obj = arr[0];
            utils.sendArticlePush(obj.id, "문의하신 글에 답변이 등록되었습니다,", idx, "cscenter");
        }
    } else {
        if (isDateColnumn) {
            sql = `INSERT INTO ?? SET ${sql} created = NOW(), modified = NOW()`;
        } else {
            sql = `INSERT INTO ?? SET ${sql.slice(0, -2)}`;
        }
    }
    const result = await utils.queryResult(sql, records);
    // console.log(result);
    res.send(result);
});

router.get("/view", userChecking, async function (req, res, next) {
    console.log("/view", req.body);

    var arr = new Object();
    arr["status"] = "success";
    res.send(arr);
});

router.post("/delete", userChecking, async function (req, res, next) {
    const table = req.body.table;
    const idxArr = req.body.idx;

    console.log(idxArr.length);

    if (Array.isArray(idxArr)) {
        for (idx of idxArr) {
            db.query(`DELETE FROM ?? WHERE idx = ?`, [table, idx]);
        }
    } else {
        db.query(`DELETE FROM ?? WHERE idx = ?`, [table, idxArr]);
    }

    res.send({
        code: 1,
        msg: "삭제 되었습니다.",
    });
});


router.post("/reply_delete", userChecking, async function (req, res, next) {
    var table = req.query.table;
    var params = JSON.parse(req.body.request);
    console.log(params);
    var sql = ``;
    for (idx of params.selected) {
        sql = `UPDATE ${table} SET id='admin', name1='관리자', memo='삭제된 댓글 입니다.', filename0='' WHERE idx = ${idx}`;
        db.query(sql);
    }
    var arr = new Object();
    arr["code"] = 1;
    res.send(arr);
});

router.post("/copy", userChecking, async function (req, res, next) {
    const table = req.query.table;
    var sql = "";
    var arr = [];

    if (!Array.isArray(req.body.idx)) {
        arr.push(req.body.idx);
    } else {
        arr = req.body.idx;
    }

    for (idx of arr) {
        await new Promise(function (resolve, reject) {
            sql = "SELECT * FROM " + table + " WHERE idx = ?";
            db.query(sql, idx, function (err, rows, fields) {
                if (!err) {
                    delete rows[0].idx;
                    delete rows[0].modified;
                    delete rows[0].created;

                    let records = [];
                    sql = "INSERT INTO " + table + " SET ";
                    for (key in rows[0]) {
                        if (rows[0][key] != "null") {
                            if (key == "pass1") {
                                sql += key + "=PASSWORD(?),";
                            } else {
                                sql += key + "=?,";
                            }
                            records.push(rows[0][key]);
                        }
                    }
                    sql += "created=NOW(),modified=NOW()";

                    db.query(sql, records, function (err, rows, fields) {
                        if (!err) {
                            resolve();
                        } else {
                            console.log(err);
                        }
                    });
                } else {
                    console.log(err);
                }
            });
        }).then();
    }

    res.send({
        code: 1,
    });
});


module.exports = router;
