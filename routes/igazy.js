const express = require("express");
const router = express.Router();
const axios = require("axios");
const utils = require("../common/utils");
const exporter = require("highcharts-export-server");

router.get("/", async function (req, res, next) {
    // var sql = ``;
    // var params = [];
    // var rtnArr = await utils.queryResult(sql, params);
    // console.log(rtnArr);

    res.render("igazy_report.html", {
        title: "Eyedoc Api",
        mode: process.env.NODE_ENV,
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

// 차트 생성을 위한 비동기 함수
async function generateChart() {
    // Export Server 초기화
    exportServer.initPool();

    const chartOptions = {
        type: "png", // 생성할 파일의 형식
        options: {
            title: {
                text: "Fruit Consumption",
            },
            xAxis: {
                categories: ["Apples", "Bananas", "Oranges"],
            },
            yAxis: {
                title: {
                    text: "Fruit eaten",
                },
            },
            series: [
                {
                    name: "Jane",
                    data: [1, 0, 4],
                },
                {
                    name: "John",
                    data: [5, 7, 3],
                },
            ],
        },
    };

    return new Promise((resolve, reject) => {
        exportServer.export(chartOptions, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
            exportServer.killPool();
        });
    });
}

module.exports = router;
