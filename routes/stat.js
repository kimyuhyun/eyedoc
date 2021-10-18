const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');
const requestIp = require('request-ip');
const percentIle = require('percentile');



// ?age=5&r_sph=-1&r_cyl=-1&l_sph=-1&l_cyl=-1
router.get('/get_eye_per', async function(req, res, next) {
    const { age, r_sph, r_cyl, l_sph, l_cyl } = req.query;

    var obj = await utils.getEyePer(age, r_sph, r_cyl, l_sph, l_cyl);
    console.log(obj);
    res.send(obj);
});


router.get('/get_default_data', async function(req, res, next) {
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

// async function getLawData() {
//
//     var tmpArr = {};
//     await new Promise(function(resolve, reject) {
//         const sql = `SELECT * FROM LAWDATA_tbl ORDER BY age ASC, rdata ASC`;
//         db.query(sql, function(err, rows, fields) {
//             if (!err) {
//                 resolve(rows);
//             } else {
//                 console.log(err);
//                 res.send(err);
//                 return;
//             }
//         });
//     }).then(function(data) {
//         var oldAge = 0;
//         for (obj of data) {
//             if (oldAge != obj.age) {
//                 oldAge = obj.age;
//                 tmpArr[obj.age] = [];
//                 tmpArr[obj.age].push(obj.rdata);
//             } else {
//                 tmpArr[obj.age].push(obj.rdata);
//             }
//         }
//     });
//     return tmpArr;
// }
// async function getEyePer2(age, r_sph, r_cyl, l_sph, l_cyl) {
//     var r_se = eval(r_sph) + eval(r_cyl / 2);
//     r_se = r_se.toFixed(2);
//     var l_se = eval(l_sph) + eval(l_cyl / 2);
//     l_se = l_se.toFixed(2);
//
//     var arr = [];
//     await new Promise(function(resolve, reject) {
//         const sql = `SELECT rdata FROM LAWDATA_tbl WHERE age = ? ORDER BY rdata ASC`;
//         db.query(sql, age, function(err, rows, fields) {
//             if (!err) {
//                 resolve(rows);
//             } else {
//                 console.log(err);
//                 res.send(err);
//                 return;
//             }
//         });
//     }).then(function(data) {
//         for (obj of utils.nvl(data)) {
//             arr.push(obj.rdata);
//         }
//     });
//
//     if (arr.length > 0) {
//
//         var tmp = 0;
//         var r_per = 0;
//         var l_per = 0;
//
//         //우안
//         try {
//             tmp = percentRank(arr, r_se);
//         } catch (e) {
//             if ((r_se * 100) < 0) {
//                 tmp = percentRank(arr, arr[0]);
//             } else {
//                 tmp = percentRank(arr, arr[arr.length-1]);
//             }
//         }
//         tmp  = formatter(tmp);
//         tmp = 1 - tmp;
//         r_per = 100 * tmp;
//         r_per = r_per * -1;
//         //
//
//         //좌안
//         try {
//             tmp = percentRank(arr, l_se);
//         } catch (e) {
//             if ((l_se * 100) < 0) {
//                 tmp = percentRank(arr, arr[0]);
//             } else {
//                 tmp = percentRank(arr, arr[arr.length-1]);
//             }
//         }
//         tmp  = formatter(tmp);
//         tmp = 1 - tmp;
//         l_per = 100 * tmp;
//         l_per = l_per * -1;
//         //
//     } else {
//         r_per = 0;
//         l_per = 0;
//     }
//
//     var obj = {
//         r_se: r_se,
//         r_per: r_per.toFixed(1),
//         l_se: l_se,
//         l_per: l_per.toFixed(1),
//     };
//
//     return obj;
// }
//
//
// function percentRank (arr, value) {
//     for (let i = 0; i < arr.length; i++) {
//         if (arr[i] == value) {
//             return i / (arr.length - 1);
//         }
//     }
//     let x1, x2, y1, y2;
//     for (let i = 0; i < arr.length - 1; i++) {
//         if (arr[i] < value && value < arr[i + 1]) {
//             // x1 = arr[i];
//             // x2 = arr[i + 1];
//             // y1 = percentRank2(arr, x1);
//             // y2 = percentRank2(arr, x2);
//             // var result = (((x2 - value) * y1 + (value - x1) * y2)) / (x2 - x1);
//
//             x1 = arr[i];
//             x2 = arr[i + 1];
//             // console.log(x1, x2, (value * 100));
//             if ((value * 100) < 0) {
//                 result = percentRank2(arr, x1);
//             } else {
//                 result = percentRank2(arr, x2);
//             }
//             return result;
//         }
//     }
//     throw new Error('Out of bounds');
// };
//
// function percentRank2 (arr, v) {
//     if (typeof v !== 'number') throw new TypeError('v must be a number');
//     for (var i = 0, l = arr.length; i < l; i++) {
//         if (v <= arr[i]) {
//             while (i < l && v === arr[i]) i++;
//             if (i === 0) return 0;
//             if (v !== arr[i-1]) {
//                 i += (v - arr[i-1]) / (arr[i] - arr[i-1]);
//             }
//             return i / l;
//         }
//     }
//     return 1;
// }
//
// function formatter (num) {
//     var tmp = '' + num;
//     tmp = tmp.split('.');
//     if (tmp.length == 1) {
//         return num;
//     }
//     return `${ tmp[0] }.${ tmp[1].substring(0,3) }`;
// }

module.exports = router;
