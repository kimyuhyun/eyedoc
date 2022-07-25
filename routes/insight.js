const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');
const requestIp = require('request-ip');
const commaNumber = require('comma-number');
const percentIle = require('percentile');

async function setLog(req, res, next) {
    //토큰 체크!
    
    next();
}



router.get('/:memb_idx', setLog, async function(req, res, next) {
    const memb_idx = req.params.memb_idx;
    var tmpArr = await utils.getLawData();

    var sql = `
        SELECT
            A.r_sph, 
            A.r_cyl,
            A.l_sph,
            A.l_cyl,
            A.wdate,
            (SELECT birth FROM MEMB_tbl WHERE idx = A.memb_idx) as birth
        FROM
        EYES_DATA_tbl as A
        WHERE A.memb_idx = ?
        ORDER BY wdate DESC
    `;
    
    var arr = await utils.queryResult(sql, [memb_idx]);
    var rtnObj = {};
    var rtnArr = [];
    var l_ile_arr = [];
    var r_ile_arr = [];

    var graph1 = {};
    var graph2 = {};

    var i = 0;
    for (obj of arr) {
        var age = utils.getAge2(obj.birth, obj.wdate.split('-')[0]);

        //age 가 5세 미만은 넘어간다!
        if (age < 5 || age > 18) {
            continue;
        }

        rtnObj = await utils.getEyesPer(age, obj.r_sph, obj.r_cyl, obj.l_sph, obj.l_cyl);

        if (i == 0) {
            //가장 최근의 데이터로 그래프1의 퍼센트 구한다!
            graph1.left_per = rtnObj.l_per;
            graph1.right_per = rtnObj.r_per;
            graph1.age = age;
        }

        var r_per = 100 + eval(rtnObj.r_per);
        var l_per = 100 + eval(rtnObj.l_per);
        
        var ll = percentIle(l_per, tmpArr[age]);
        var rr = percentIle(r_per, tmpArr[age]);
        
        // console.log(age, ll, rr);
        
        l_ile_arr.push({
            wdate: obj.wdate.substring(2),
            age: age,
            val: ll,
        });

        r_ile_arr.push({
            wdate: obj.wdate.substring(2),
            age: age,
            val: rr,
        })

        rtnArr.push(rtnObj);
        i++;
    }

    //과거가 처음부나 나오게 하기 위해서 배열 리버스 한다!
    graph2.left_arr = l_ile_arr.reverse();
    graph2.right_arr = r_ile_arr.reverse();

    if (!graph1.age) {
        var sql = `SELECT birth FROM MEMB_tbl WHERE idx = ?`;
        var arr = await utils.queryResult(sql,[memb_idx]);
        var age = utils.getAge(arr[0].birth);
        res.send({
            code: 0,
            msg: `만 5세 ~ 만 18세 사이의 데이터만 제공되고 있습니다.`,
        });
        return;
    }


    //가장 마지막 나이를 가지고 평균을 구한다! - 평균또래 근시진행률
    var sql = `SELECT AVG(rdata) as se FROM LAWDATA_tbl WHERE age = ?`;
    var arr = await utils.queryResult(sql, [graph1.age]);
    var se = arr[0].se;
    se = se.toFixed(2);

    var sql = `SELECT rdata FROM LAWDATA_tbl WHERE age = ? ORDER BY rdata ASC`;
    var arr = await utils.queryResult(sql, [graph1.age]);
    var rdataArr = [];
    for (obj of arr) {
        rdataArr.push(obj.rdata);
    }

    var tmp = await utils.percentRank(rdataArr, se);
    tmp  = await utils.formatter(tmp);
    tmp = 1 - tmp;
    var avg_per = 100 * tmp;
    avg_per = avg_per * -1;
    avg_per = avg_per.toFixed(1);

    var graph3 = {};
    graph3.left_per = graph1.left_per;
    graph3.right_per = graph1.right_per;
    graph3.avg_per = avg_per;

    res.send({
        code: 1,
        graph1,
        graph2,
        graph3
    });
});

router.get('/test/:age', setLog, async function(req, res, next) {
    const age = req.params.age

    var sql = `SELECT AVG(rdata) as se FROM LAWDATA_tbl WHERE age = ?`;
    var arr = await utils.queryResult(sql, [age]);
    var se = arr[0].se;
    if (!se) {
        res.send(`${age}세의 데이터는 없습니다.`)
        return;
    }
    se = se.toFixed(2);

    console.log('se', se);

    var sql = `SELECT rdata FROM LAWDATA_tbl WHERE age = ? ORDER BY rdata ASC`;
    var arr = await utils.queryResult(sql, [age]);
    var rdataArr = [];
    for (obj of arr) {
        rdataArr.push(obj.rdata);
    }

    var tmp = await utils.percentRank(rdataArr, se);
    tmp  = await utils.formatter(tmp);
    tmp = 1 - tmp;
    var per = 100 * tmp;
    // per = per * -1;
    per = per.toFixed(1);
    console.log(per);

    res.send(`${age}세 나이의 근시진행률은 ${per}% , se: ${se}`);
});

module.exports = router;
