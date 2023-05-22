const express = require("express");
const router = express.Router();
const utils = require("../common/utils");
const moment = require("moment");
const tokenManager = require("../common/tokenManager");
const fs = require("fs");
const middleware = require("../common/middleware");

router.post("/login", async function (req, res, next) {
    const { id, pw, remember } = req.body;
    const sql = `SELECT idx, id, name1, level1, filename0 FROM MEMB_tbl WHERE id = ? AND pass1 = PASSWORD(?)`;
    const arr = await utils.queryResult(sql, [id, pw]);
    const obj = arr[0];

    if (!obj) {
        res.send({
            code: 0,
            msg: "아이디/패스워드가 일치 하지 않습니다.",
        });
        return;
    }

    if (obj.level1 > 2) {
        res.send({
            code: 0,
            msg: "접근권한이 없습니다.",
        });
        return;
    }

    var user = {};
    var save = {};

    if (remember) {
        save.id = obj.id;
        save.pw = pw;
    }

    user.idx = obj.idx;
    user.id = obj.id;
    user.name1 = obj.name1;
    user.level1 = obj.level1;

    req.session.idx = obj.idx;
    req.session.id = obj.id;
    req.session.name1 = obj.name1;
    req.session.level1 = obj.level1;
    req.session.browser = req.headers["user-agent"];

    res.send({
        code: 1,
        user,
        save,
    });
});

router.get("/logout", async function (req, res, next) {
    req.session.destroy();
    res.send({
        code: 1,
    });
});

router.get("/manager", middleware.checkToken, async function (req, res, next) {
    var { search_column, search_value, orderby, page } = req.query;

    var where = `WHERE level1 = 2 `;
    var records = [];

    if (search_column && search_value) {
        where += ` AND ?? LIKE ? `;
        records.push(search_column);
        records.push(`%${search_value}%`);
    } else {
        search_column = "";
        search_value = "";
    }

    if (orderby) {
        if (orderby.toLowerCase().includes("delete") || orderby.toLowerCase().includes("update") || orderby.toLowerCase().includes("select")) {
            res.send({ list: [], page_helper: {}, search_column, search_value, orderby });
            return;
        }
    } else {
        orderby = " idx DESC ";
    }

    var sql = `SELECT COUNT(*) as cnt FROM MEMB_tbl ${where}`;
    var arr = await utils.queryResult(sql, records);
    if (!arr) {
        res.send({
            list: [],
            page_helper: {},
        });
        return;
    }
    const pageHeler = utils.pageHelper(page, arr[0].cnt ?? 0);

    records.push(pageHeler.skipSize);
    records.push(pageHeler.contentSize);

    sql = `SELECT * FROM MEMB_tbl ${where} ORDER BY ${orderby} LIMIT ?, ?`;
    arr = await utils.queryResult(sql, records);
    for (obj of arr) {
        obj.created = utils.utilConvertToMillis(obj.created);
        obj.modified = utils.utilConvertToMillis(obj.modified);
    }
    res.send({
        list: arr,
        page_helper: pageHeler,
        search_column,
        search_value,
        orderby,
    });
});

router.get("/user", middleware.checkToken, async function (req, res, next) {
    var { search_column, search_value, orderby, page } = req.query;

    var where = `WHERE level1 = 9 `;
    var records = [];

    if (search_column && search_value) {
        where += ` AND ?? LIKE ? `;
        records.push(search_column);
        records.push(`%${search_value}%`);
    } else {
        search_column = "";
        search_value = "";
    }

    if (orderby) {
        if (orderby.toLowerCase().includes("delete") || orderby.toLowerCase().includes("update") || orderby.toLowerCase().includes("select")) {
            res.send({ list: [], page_helper: {}, search_column, search_value, orderby });
            return;
        }
    } else {
        orderby = " idx DESC ";
    }

    var sql = `SELECT COUNT(*) as cnt FROM MEMB_tbl ${where}`;
    var arr = await utils.queryResult(sql, records);
    if (!arr) {
        res.send({
            list: [],
            page_helper: {},
        });
        return;
    }
    const pageHeler = utils.pageHelper(page, arr[0].cnt ?? 0);

    records.push(pageHeler.skipSize);
    records.push(pageHeler.contentSize);

    sql = `SELECT * FROM MEMB_tbl ${where} ORDER BY ${orderby} LIMIT ?, ?`;
    arr = await utils.queryResult(sql, records);
    for (obj of arr) {
        obj.created = utils.utilConvertToMillis(obj.created);
        obj.modified = utils.utilConvertToMillis(obj.modified);
    }
    res.send({
        list: arr,
        page_helper: pageHeler,
        search_column,
        search_value,
        orderby,
    });
});

router.get("/grade", middleware.checkToken, async function (req, res, next) {
    const sql = `SELECT * FROM GRADE_tbl ORDER BY level1 ASC `;
    const arr = await utils.queryResult(sql, []);

    var list = [];
    for (row of arr) {
        row.created = utils.utilConvertToMillis(row.created);
        row.modified = utils.utilConvertToMillis(row.modified);
        list.push(row);
    }
    res.send(list);
});

router.get("/analyzer/graph1", middleware.checkToken, async function (req, res, next) {
    var gap = 0;
    const dateArr = [];
    const ttlArr = [];
    const new1Arr = [];
    const reArr = [];

    while (gap <= 6) {
        const date = moment().subtract(gap, "d").format("YYYY-MM-DD");
        const hangleDate = moment().subtract(gap, "d").format("YYYY년MM월DD일");
        var total = 0;

        //총방문자 구하기
        var sql = `SELECT COUNT(DISTINCT ip) AS cnt FROM ANALYZER_tbl WHERE LEFT(created, 10) = ?`;
        var arr = await utils.queryResult(sql, [date]);
        total = arr[0].cnt ?? 0;

        //신규방문자 구하기
        sql = `SELECT COUNT(DISTINCT ip) AS cnt FROM ANALYZER_tbl WHERE VISIT = 1 AND LEFT(created, 10) = ?`;
        arr = await utils.queryResult(sql, [date]);
        const new1 = arr[0].cnt ?? 0;

        dateArr.push(hangleDate);
        ttlArr.push(total);
        new1Arr.push(new1);
        reArr.push(total - new1);

        gap++;
    }

    res.send({
        date: dateArr.reverse(),
        ttl: ttlArr.reverse(),
        new1: new1Arr.reverse(),
        re: reArr.reverse(),
    });
});

router.get("/analyzer/graph2", middleware.checkToken, async function (req, res, next) {
    var gap = 0;
    const dateArr = [];
    const trafficArr = [];

    while (gap <= 6) {
        const date = moment().subtract(gap, "d").format("YYYY-MM-DD");
        const hangleDate = moment().subtract(gap, "d").format("YYYY년MM월DD일");
        var total = 0;

        //트래픽 구하기
        const sql = `SELECT COUNT(ip) AS cnt FROM ANALYZER_tbl WHERE LEFT(created, 10) = ?`;
        const arr = await utils.queryResult(sql, [date]);
        const obj = arr[0];
        trafficArr.push(obj.cnt ?? 0);
        dateArr.push(hangleDate);
        gap++;
        //
    }
    res.send({
        date: dateArr.reverse(),
        traffic: trafficArr.reverse(),
    });
});

router.get("/analyzer/graph3", middleware.checkToken, async function (req, res, next) {
    var gap = 0;

    const today = moment().subtract(0, "d").format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "d").format("YYYY-MM-DD");
    const weekago = moment().subtract(6, "d").format("YYYY-MM-DD");

    const timeArr = [];
    const data1Arr = [];
    const data2Arr = [];
    const data3Arr = [];
    var time = "";
    for (var i = 0; i < 24; i++) {
        if (i < 10) {
            time = "0" + i;
        } else {
            time = i;
        }

        timeArr.push(time);

        //오늘 시간대별 트래픽 구하기
        var sql = `SELECT COUNT(ip) AS cnt FROM ANALYZER_tbl WHERE LEFT(created, 10) = ? AND SUBSTR(created, 12, 2) = ?`;
        var arr = await utils.queryResult(sql, [today, time]);
        var obj = arr[0];
        data1Arr.push(obj.cnt ?? 0);
        //

        //어제 시간대별 트래픽 구하기
        sql = `SELECT COUNT(ip) AS cnt FROM ANALYZER_tbl WHERE LEFT(created, 10) = ? AND SUBSTR(created, 12, 2) = ?`;
        arr = await utils.queryResult(sql, [yesterday, time]);
        obj = arr[0];
        data2Arr.push(obj.cnt ?? 0);
        //

        //일주일전 시간대별 트래픽 구하기
        sql = `SELECT COUNT(ip) AS cnt FROM ANALYZER_tbl WHERE LEFT(created, 10) = ? AND SUBSTR(created, 12, 2) = ?`;
        arr = await utils.queryResult(sql, [weekago, time]);
        obj = arr[0];
        data3Arr.push(obj.cnt ?? 0);
        //
    }

    res.send({
        time: timeArr,
        today: data1Arr,
        yesterday: data2Arr,
        weekago: data3Arr,
    });
});

router.get("/liveuser", middleware.checkToken, (req, res, next) => {
    const arr = [];

    fs.readdir("./liveuser", async function (err, filelist) {
        for (file of filelist) {
            await new Promise(function (resolve, reject) {
                fs.readFile("./liveuser/" + file, "utf8", function (err, data) {
                    resolve(data);
                });
            }).then(function (data) {
                try {
                    if (file != "dummy") {
                        const tmp = data.split("|S|");
                        console.log(data);
                        // moment.tz.setDefault("Asia/Seoul");
                        const connTime = moment.unix(tmp[0] / 1000).format("YYYY-MM-DD HH:mm");
                        const minDiff = moment.duration(moment(new Date()).diff(moment(connTime))).asMinutes();
                        if (minDiff > 4) {
                            console.log(minDiff);
                            fs.unlink("./liveuser/" + file, function (err) {
                                console.log(err);
                            });
                        }
                        arr.push({
                            id: file,
                            url: tmp[1],
                            date: connTime,
                        });
                    }
                } catch (e) {
                    console.log(e);
                }
            });
        }

        console.log(arr);

        res.send({
            currentTime: moment().format("YYYY-MM-DD HH:mm:ss"),
            list: arr,
        });
    });
});

module.exports = router;
