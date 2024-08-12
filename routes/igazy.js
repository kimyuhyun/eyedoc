const express = require("express");
const router = express.Router();
const axios = require("axios");
const utils = require("../common/utils");
const fs = require("fs").promises;

router.get("/", async function (req, res, next) {
    const json_data = await fs.readFile("data.json", "utf8");
    console.log(json_data);

    res.render("igazy_report.html", {
        json_data: json_data,
    });
});

function tokenVerify(req, res, next) {
    // if (!req.headers.authorization) {
    //     res.json({ code: 0, msg: "token is empty" });
    //     return;
    // }
    // const token = req.headers.authorization.split("Bearer ")[1]; // header에서 access token을 가져옵니다.
    // if (!token) {
    //     res.json({ code: 0, msg: "token is empty" });
    //     return;
    // }
    // const time = aes256Util.decrypt(token);
    // const currentTime = new Date().getTime();
    // const diff = currentTime / 1000 - time / 1000;
    // console.log(currentTime + " - " + time + " = " + diff);
    // if (diff > 10) {
    //     res.json({ code: 0, msg: "token is expried" });
    //     return;
    // }
    next();
}

router.get("/list", tokenVerify, async function (req, res, next) {
    const { writer_id } = req.query;
    const sql = `
        SELECT  
            idx,
            writer_id,
            gender,
            name1,
            dob,
            patient_num,
            wdate
        FROM IGAZY_tbl 
        WHERE writer_id = ?
        AND is_used = 1 
        ORDER BY idx DESC
    `;
    const arr = await utils.queryResult(sql, [writer_id]);
    res.json({
        code: 1,
        result: arr,
    });
});

router.get("/detail", tokenVerify, async function (req, res, next) {
    const { writer_id, idx } = req.query;
    const sql = `SELECT * FROM IGAZY_tbl WHERE idx = ? AND writer_id = ? AND is_used = 1`;
    const arr = await utils.queryResult(sql, [idx, writer_id]);
    const obj = arr[0];
    if (!obj) {
        res.json({ code: 0, msg: "no data" });
        return;
    }
    console.log(obj);
    res.json({
        code: 1,
        result: obj,
    });
});

router.get("/report", tokenVerify, async function (req, res, next) {
    const { writer_id, idx } = req.query;
    const sql = `SELECT * FROM IGAZY_tbl WHERE idx = ? AND writer_id = ? AND is_used = 1`;
    const arr = await utils.queryResult(sql, [idx, writer_id]);
    const obj = arr[0];
    if (!obj) {
        res.json({ code: 0, msg: "no data" });
        return;
    }

    res.render("igazy_report.html", {
        writer_id: obj.writer_id,
        wdate: obj.wdate,
        name1: obj.name1,
        dob: obj.dob,
        gender: obj.gender,
        json_data: obj.json_data,
    });
});

module.exports = router;
