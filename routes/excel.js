const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');
const requestIp = require('request-ip');
const commaNumber = require('comma-number');
const xlsx = require('xlsx');
const percentIle = require('stats-percentile');

router.get('/', async function(req, res, next) {

    const workbook = xlsx.readFile('./public/myopia_V2.xlsx'); //xlsx 파일 가져와서 객체 생성
    const sheetnames = Object.keys(workbook.Sheets); //엑셀 sheets 이름 가져오기
    const sheetname = sheetnames[7]; //한개의 sheet
    result = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);

    var i =0;
    for (obj of result) {
        if (obj['나이'] > 6) {
            break;
        }

        await new Promise(function(resolve, reject) {
            setTimeout(async function() {
                const sql = `INSERT INTO LAWDATA_tbl SET age = ?, rdata = ?`;
                db.query(sql, [obj['나이'], obj['굴절']], function(err, rows, fields) {
                    // console.log(rows);
                    if (!err) {
                        i++;
                        console.log(i);
                        resolve();
                    } else {
                        console.log(err);
                        res.send(err);
                        return;
                    }
                });
            }, 10);
        }).then();
    }

    res.send('dev');
});

router.get('/test', async function(req, res, next) {
    const se = req.query.se;

    var arr = [];
    await new Promise(function(resolve, reject) {
        const sql = `SELECT rdata FROM LAWDATA_tbl WHERE age = 5 ORDER BY rdata ASC`;
        db.query(sql, function(err, rows, fields) {
            // console.log(rows);
            if (!err) {
                resolve(rows);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then(function(data) {
        for (obj of data) {
            arr.push(obj.rdata);
        }
    });

    var tmp1 = 0;

    try {
        tmp1 = percentRank(arr, se);
    } catch (e) {
        if ((se * 100) < 0) {
            tmp1 = percentRank(arr, arr[0]);
        } else {
            tmp1 = percentRank(arr, arr[arr.length-1]);
        }
    } finally {

    }

    res.send(''+formatter(tmp1));
});

function percentRank (arr, value) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === value) {
            return i / (arr.length - 1);
        }
    }
    let x1, x2, y1, y2;
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < value && value < arr[i + 1]) {
            // x1 = arr[i];
            // x2 = arr[i + 1];
            // y1 = percentRank2(arr, x1);
            // y2 = percentRank2(arr, x2);
            // var result = (((x2 - value) * y1 + (value - x1) * y2)) / (x2 - x1);

            x1 = arr[i];
            x2 = arr[i + 1];
            // console.log(x1, x2);
            if ((value * 100) < 0) {
                result = percentRank2(arr, x1);
            } else {
                result = percentRank2(arr, x2);
            }

            result = percentRank2(arr, x1);

            return result;
        }
    }
    throw new Error('Out of bounds');
};


function percentRank2(arr, v) {
    if (typeof v !== 'number') throw new TypeError('v must be a number');
    for (var i = 0, l = arr.length; i < l; i++) {
        if (v <= arr[i]) {
            while (i < l && v === arr[i]) i++;
            if (i === 0) return 0;
            if (v !== arr[i-1]) {
                i += (v - arr[i-1]) / (arr[i] - arr[i-1]);
            }
            return i / l;
        }
    }
    return 1;
}


function formatter(num) {
    var tmp = '' + num;
    tmp = tmp.split('.');
    if (tmp.length == 1) {
        return num;
    }
    return `${ tmp[0] }.${ tmp[1].substring(0,3) }`;
}

module.exports = router;
