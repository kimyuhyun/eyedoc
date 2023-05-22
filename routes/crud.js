const express = require("express");
const router = express.Router();
const db = require("../common/db");
const utils = require("../common/utils");
const middleware = require("../common/middleware");

router.get("/read", middleware.checkToken, async function (req, res, next) {
    const { idx, table } = req.query;

    var row = {};

    if (idx) {
        const sql = `SELECT * FROM ?? WHERE idx = ?`;
        const arr = await utils.queryResult(sql, [table, idx]);
        row = arr[0];
    }
    res.send(row);
});

router.post("/write", middleware.checkToken, async function (req, res, next) {
    const table = req.body.table;
    const idx = req.body.idx;

    delete req.body.table;
    delete req.body.idx;

    var isDateColnumn = true;

    //날짜 컬럼이 있는지 확인!
    var sql = `SHOW COLUMNS FROM ?? LIKE 'created'`;
    var arr = await utils.queryResult(sql, [table]);
    if (!arr[0]) {
        isDateColnumn = false;
    }

    const records = [];
    records.push(table);

    sql = "";
    for (key in req.body) {
        if (req.body[key] != "null") {
            if (key == "pass1") {
                if (req.body[key]) {
                    sql += key + "= PASSWORD(?), ";
                    records.push(req.body[key]);
                }
            } else {
                sql += key + "= ?, ";
                records.push(req.body[key]);
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
    } else {
        if (isDateColnumn) {
            sql = `INSERT INTO ?? SET ${sql} created = NOW(), modified = NOW()`;
        } else {
            sql = `INSERT INTO ?? SET ${sql.slice(0, -2)}`;
        }
    }
    const result = await utils.queryResult(sql, records);
    console.log(result);
    res.send(result);
});

router.post("/delete", middleware.checkToken, async function (req, res, next) {
    const table = req.body.table;
    const idxArr = req.body.idx;

    console.log(idxArr.length);

    if (Array.isArray(idxArr)) {
        for (idx of idxArr) {
            await utils.queryResult(`DELETE FROM ?? WHERE idx = ?`, [table, idx]);
        }
    } else {
        await utils.queryResult(`DELETE FROM ?? WHERE idx = ?`, [table, idxArr]);
    }

    res.send({
        code: 1,
        msg: "삭제 되었습니다.",
    });
});

router.post("/update_where", middleware.checkToken, async function (req, res, next) {
    const table = req.body.table;
    const where = req.body.where;
    const set = req.body.set;

    //인젝션 검사!
    for (key in req.body) {
        if (
            req.body[key].toLowerCase().includes("insert") ||
            req.body[key].toLowerCase().includes("delete") ||
            req.body[key].toLowerCase().includes("update") ||
            req.body[key].toLowerCase().includes("select")
        ) {
            res.status(500).send("error");
            return;
        }
    }
    //

    const sql = `UPDATE ?? SET ${set} WHERE ${where}`;
    const arr = await utils.queryResult(sql, [table]);
    res.status(200).send(arr);
});

router.post("/delete_where", middleware.checkToken, async function (req, res, next) {
    const table = req.body.table;
    const where = req.body.where;

    //인젝션 검사!
    for (key in req.body) {
        if (
            req.body[key].toLowerCase().includes("insert") ||
            req.body[key].toLowerCase().includes("delete") ||
            req.body[key].toLowerCase().includes("update") ||
            req.body[key].toLowerCase().includes("select")
        ) {
            res.status(500).send("error");
            return;
        }
    }
    //

    const sql = `DELETE FROM ?? WHERE ${where}`;
    const arr = await utils.queryResult(sql, [table]);
    res.status(200).send(arr);
});

module.exports = router;
