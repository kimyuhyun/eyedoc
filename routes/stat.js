const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../common/db');
const utils = require('../common/utils');
const moment = require('moment');
const requestIp = require('request-ip');
const percentIle = require('percentile');
const middleware = require('../common/middleware');


// ?age=5&r_sph=-1&r_cyl=-1&l_sph=-1&l_cyl=-1
router.get('/get_eyes_per', middleware.checkToken, async function(req, res, next) {
    const { age, r_sph, r_cyl, l_sph, l_cyl } = req.query;

    var obj = await utils.getEyesPer(age, r_sph, r_cyl, l_sph, l_cyl);
    obj.age = age;
    res.send(obj);
});


router.get('/get_eyes_ile', middleware.checkToken, async function(req, res, next) {
    const { age, r_sph, r_cyl, l_sph, l_cyl } = req.query;

    var tmpAge = 0;
    var obj = await utils.getEyesPer(age, r_sph, r_cyl, l_sph, l_cyl);
    var tmpArr = await utils.getLawData();
    obj.age = age;

    if (age > 18) {
        tmpAge = 18;
    } else {
        tmpAge = age;
    }

    var rIleArr = [];
    var lIleArr = [];

    if (obj.r_per != 0 && obj.l_per != 0) {
        var r_per = 0, l_per = 0;
         r_per = 100 + eval(obj.r_per);
         l_per = 100 + eval(obj.l_per);
         rIleArr.push(percentIle(r_per, tmpArr[tmpAge]));
         lIleArr.push(percentIle(l_per, tmpArr[tmpAge]));
    }

    var arr = {
        age: tmpAge,
        r_ile_arr: rIleArr,
        l_ile_arr: lIleArr,
    };
    res.send(arr);
});


router.get('/get_default_data', middleware.checkToken, async function(req, res, next) {
    var tmpArr = await utils.getLawData();
    var objArr = {};


    var p95 = [];
    var p90 = [];
    var p75 = [];
    var p50 = [];
    var p25 = [];
    var p10 = [];
    var p5 = [];
    for (var i=5;i<=18;i++) {
         p95.push(percentIle(100-95, tmpArr[i]));
         p90.push(percentIle(100-90, tmpArr[i]));
         p75.push(percentIle(100-75, tmpArr[i]));
         p50.push(percentIle(100-50, tmpArr[i]));
         p25.push(percentIle(100-25, tmpArr[i]));
         p10.push(percentIle(100-10, tmpArr[i]));
         p5.push(percentIle(100-5, tmpArr[i]));
    }

    res.send({
        p95: p95,
        p90: p90,
        p75: p75,
        p50: p50,
        p25: p25,
        p10: p10,
        p5: p5,
    });
});

module.exports = router;
