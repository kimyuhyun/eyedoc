const express = require('express');
const router = express.Router();
const fs = require('fs');
const utils = require('../Utils');

async function setLog(req, res, next) {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    var sql = `SELECT visit FROM ANALYZER_tbl WHERE ip = ? ORDER BY idx DESC LIMIT 0, 1`;
    var arr = await utils.queryResult(sql, [ip]);
    var obj = arr[0];

    if (obj) {
        sql = `INSERT INTO ANALYZER_tbl SET ip = ?, agent = ?, visit = ?, created = NOW()`;
        var cnt = obj.visit + 1;
        await utils.queryResult(sql, [ip, req.headers["user-agent"], cnt]);
    }

    //4분이상 것들 삭제!!
    fs.readdir("./liveuser", async function (err, filelist) {
        for (file of filelist) {
            await fs.readFile(`./liveuser/${file}`, 'utf8', async function (err, data) {
                try {
                    if (data != 'dummy' || data != '') {
                        var tmp = data.split("|S|");
                        moment.tz.setDefault("Asia/Seoul");
                        var connTime = moment.unix(tmp[0] / 1000).format("YYYY-MM-DD HH:mm");
                        var minDiff = moment.duration(moment(new Date()).diff(moment(connTime))).asMinutes();
                        if (minDiff > 4) {
                            await fs.unlink(`./liveuser/${file}`, function (err) {
                                console.log(err);
                            });
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            });
        }
    });

    //현재 접속자 파일 생성
    const memo = `${new Date().getTime()}|S|${req.baseUrl}${req.path}`;
    await fs.writeFile(`./liveuser/${ip}`, memo, function (err) {
        // console.log(memo);
    });
    //
    next();
}

router.get('/memb_leave/:id', setLog, async function(req, res, next) {
    const id = req.params.id;
    var sql = `UPDATE MEMB_tbl SET pid = ? WHERE pid = ?`;
    var params = [`${id}_leave`, id];
    var arr = await utils.queryResult(sql, params);

    sql = `UPDATE MEMB_tbl SET id = ? WHERE id = ?`;
    params = [`${id}_leave`, id];
    arr = await utils.queryResult(sql, params);

    console.log(arr);
    res.send(arr);
});



router.get('/', setLog, async function(req, res, next) {

    // var sql = ``;
    // var params = [];
    // var rtnArr = await utils.queryResult(sql, params);
    // console.log(rtnArr);

    res.send('dev');
});



module.exports = router;
