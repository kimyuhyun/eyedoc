const express = require('express');
const router = express.Router();
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');
const requestIp = require('request-ip');
const commaNumber = require('comma-number');
const shortHash = require("shorthash");
const { log } = require('console');


async function setLog(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var rows;
    await new Promise(function(resolve, reject) {
        var sql = `SELECT visit FROM ANALYZER_tbl WHERE ip = ? ORDER BY idx DESC LIMIT 0, 1`;
        db.query(sql, ip, function(err, rows, fields) {
            if (!err) {
                resolve(rows);
            }
        });
    }).then(function(data){
        rows = data;
    });

    await new Promise(function(resolve, reject) {
        var sql = `INSERT INTO ANALYZER_tbl SET ip = ?, agent = ?, visit = ?, created = NOW()`;
        if (rows.length > 0) {
            var cnt = rows[0].visit + 1;
            db.query(sql, [ip, req.headers['user-agent'], cnt], function(err, rows, fields) {
                resolve(cnt);
            });
        } else {
            db.query(sql, [ip, req.headers['user-agent'], 1], function(err, rows, fields) {
                resolve(1);
            });
        }
    }).then(function(data) {
        console.log(data);
    });

    //현재 접속자 파일 생성
    var memo = new Date().getTime() + "|S|" + req.baseUrl + req.path;
    fs.writeFile('./liveuser/'+ip, memo, function(err) {
        console.log(memo);
    });
    //
    next();
}

router.post('/sight_test_detail_add', async function(req, res, next) {
    var sightTesIdx = req.body.sight_test_idx;
    var membIdx = req.body.memb_idx;
    var eyeGbnList = req.body.eye_gbn;
    var questionList = req.body.question;
    var questionNumList = req.body.question_num;
    var answerList = req.body.answer;
    var answerVoiceUrlList = req.body.answer_voice_url;
    var rightYnList = req.body.right_yn;

    var rtnArr = [];
    var sql = ``;
    for (var i in eyeGbnList) {
        sql = `
            INSERT INTO SIGHT_TEST_DETAIL_tbl SET 
                sight_test_idx = ?, 
                memb_idx = ?, 
                eye_gbn = ?,
                question = ?,
                question_num = ?,
                answer = ?,
                answer_voice_url = ?,
                right_yn = ?
        `;
        var params = [
            sightTesIdx, 
            membIdx, 
            eyeGbnList[i], 
            questionList[i], 
            questionNumList[i],
            answerList[i],
            answerVoiceUrlList[i],
            rightYnList[i]
        ];
        rtnArr = await utils.queryResult(sql, params)
        console.log(rtnArr);
    }
    res.send(true);
});

router.get('/get_sight_test_list/:memb_idx', setLog, async function(req, res, next) {
    const membIdx = req.params.memb_idx;

    var sql = `SELECT * FROM SIGHT_TEST_tbl WHERE memb_idx = ? ORDER BY created DESC`;
    var params = [membIdx];
    var rtnArr = await utils.queryResult(sql, params);
    // console.log(rtnArr);
    res.send(rtnArr);
});

router.get('/get_sight_test_data/:idx', setLog, async function(req, res, next) {
    const idx = req.params.idx;

    var sql = `
        SELECT 
        A.*,
        (SELECT name1 FROM MEMB_tbl WHERE idx = A.memb_idx) as name1,
        (SELECT filename0 FROM MEMB_tbl WHERE idx = A.memb_idx) as thumb 
        FROM 
        SIGHT_TEST_tbl as A 
        WHERE A.idx = ?`;
    var params = [idx];
    var rtnArr = await utils.queryResult(sql, params);
    var obj = rtnArr[0];
    res.send(obj);
});

router.get('/get_sight_test_detail_list/:sight_test_idx', setLog, async function(req, res, next) {
    const sight_test_idx = req.params.sight_test_idx;

    var sql = `SELECT * FROM SIGHT_TEST_DETAIL_tbl WHERE sight_test_idx = ?`;
    var params = [sight_test_idx];
    var rtnArr = await utils.queryResult(sql, params);
    res.send(rtnArr);
});

router.get('/get_sight_test_insight/:memb_idx', setLog, async function(req, res, next) {
    const membIdx = req.params.memb_idx;

    var results = {};
    results.l_list = [];
    results.r_list = [];
    results.date_list = [];
    results.err_msg = '';

    var sql = `SELECT l_sight, r_sight, created FROM SIGHT_TEST_tbl WHERE memb_idx = ? ORDER BY created ASC`;
    var params = [membIdx];
    var rtnArr = await utils.queryResult(sql, params);

    if (rtnArr.length == 0) {
        results.err_msg = '입력된 시력 측정 결과가 없어 인사이트를 구성하지 못하였습니다.';
        res.send(results);
        return;
    }

    results.l_sight = rtnArr[rtnArr.length-1].l_sight;
    results.r_sight = rtnArr[rtnArr.length-1].r_sight;
    

    for (obj of rtnArr) {
        results.l_list.push(obj.l_sight);
        results.r_list.push(obj.r_sight);
        results.date_list.push(obj.created.split(" ")[0]);
    }
    

    //또래 평균 구하기!!
    sql = `SELECT birth FROM MEMB_tbl WHERE idx = ?`;
    params = [membIdx];
    rtnArr = await utils.queryResult(sql, params);
    var birth = rtnArr[0].birth;
    var year = birth.substring(0, 4);

    sql = `
        SELECT Z.* FROM (
            SELECT
                (SELECT LEFT(birth, 4) FROM MEMB_tbl WHERE idx = A.memb_idx) as year,
                l_sight,
                r_sight
            FROM SIGHT_TEST_tbl as A
        ) as Z
        WHERE year = ?
    `;
    params = [year];
    rtnArr = await utils.queryResult(sql, params);

    var lSum = 0;
    var rSum = 0;
    var lCnt = 0;
    var rCnt = 0;
    for (obj of rtnArr) {
        if (obj.l_sight != '측정불가') {
            lSum += eval(obj.l_sight);
            lCnt++;
        }

        if (obj.r_sight != '측정불가') {
            rSum += eval(obj.r_sight);
            rCnt++;
        }
    }

    var lAvg = lSum / lCnt;
    var rAvg = rSum / rCnt;

    //아직은 인사이트에서 오른/왼 쪽 나눠준 그래프가 없으므로 2개 의 평균을 리턴한다!
    var avg = (lAvg + rAvg) / 2;
    avg = avg.toFixed(1);
    console.log(avg);

    results.avg = avg;

    

    res.send(results);
});

router.get('/get_share_link/:sight_test_idx', setLog, async function(req, res, next) {
    const idx = req.params.sight_test_idx;
   
    //숏해쉬가 너무 짧아! 중복이 생긴다!! 그래서 현재시간과 함께 암호화 한다!
    const token = shortHash.unique(`${new Date()}${idx}`);

    var sql = `SELECT count(*) as cnt FROM SIGHT_TEST_SHARE_tbl WHERE token = ?`;
    var params = [token];
    var rtnArr = await utils.queryResult(sql, params);
    var row = rtnArr[0];
    
    if (row.cnt == 0) {
        sql = `INSERT INTO SIGHT_TEST_SHARE_tbl SET token = ?, sight_test_idx = ?`;
        params = [token, idx];
        await utils.queryResult(sql, params);
    }
    res.send(token);
});

router.get('/get_sight_test_idx/:token', setLog, async function(req, res, next) {
    const token = req.params.token;

    var sql = `SELECT sight_test_idx FROM SIGHT_TEST_SHARE_tbl WHERE token = ?`;
    var params = [token];
    var rtnArr = await utils.queryResult(sql, params);
    var row = rtnArr[0];
    if (row) {
        res.send(row.sight_test_idx);
    } else {
        res.send(``);
    }
    
});

router.post('/delete_sight_test', setLog, async function(req, res, next) {
    const idx = req.body.idx;
    
    var sql = `DELETE FROM SIGHT_TEST_DETAIL_tbl WHERE sight_test_idx = ?`;
    var params = [idx];
    await utils.queryResult(sql, params);
    
    sql = `DELETE FROM SIGHT_TEST_tbl WHERE idx = ?`;
    params = [idx];
    await utils.queryResult(sql, params);

    sql = `DELETE FROM SIGHT_TEST_SHARE_tbl WHERE sight_test_idx = ?`;
    params = [idx];
    await utils.queryResult(sql, params);

    res.send({
        code: 1,
        msg: '삭제 되었습니다.'
     });
});

router.get('/', setLog, async function(req, res, next) {

    // var sql = ``;
    // var params = [];
    // var rtnArr = await utils.queryResult(sql, params);
    // console.log(rtnArr);

    res.send('dev');
});



module.exports = router;
