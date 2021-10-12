const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');
const requestIp = require('request-ip');
const commaNumber = require('comma-number');
const css = `
    <style>
    .container {
        flex-direction: row;
        justify-content: space-between;
        display: flex;
        font-size: 18px;
    }

    .column {
        flex-direction: column;
        display: flex;
    }
    .vcenter {
        align-self: center;
    }
    .small {
        font-size: 12px;
    }
    </style>
`;

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

router.get('/1', async function(req, res, next) {
    console.log(req.query);
    var { contract, building } = req.query;

    if (contract == '매매' && building == '주거용') {
        c0b0(req, res);
    }

});

function c0b0(req, res) {
    var { amount, rent, rate } = req.query;
    var limitFees = 0;
    var rateDesc = '';
    var limitFeesDesc = '';
    if (amount < 5000) {
        //5천만원 미만
        rate = rate != '' ? rate : 0.6;
        rateDesc = '5천 미만 상한요율 0.6%';
        limitFees = 250000;
        limitFeesDesc = '5천 미만 매매 한도액 25만원';
    } else if (amount >= 5000 && amount < 20000) {
        //5천만원 이상 2억 미만
        rate = rate != '' ? rate : 0.5;
        rateDesc = '5천 이상 2억 미만 상한요율 0.5%';
        limitFees = 800000;
        limitFeesDesc = '5천 이상 2억 미만 매매 한도액 80만원';
    } else if (amount >= 20000 && amount < 60000) {
        //2억 이상 6억 미만
        rate = rate != '' ? rate : 0.4;
        rateDesc = '2억 이상 6억 미만 상한요율 0.4%';
    } else if (amount >= 60000 && amount < 90000) {
        //6억 이상 9억 미만
        rate = rate != '' ? rate : 0.5;
        rateDesc = '6억 이상 9억 미만 상한요율 0.5%';
    } else if (amount >= 90000) {
        //9억 이상
        rate = rate != '' ? rate : 0.9;
        rateDesc = '9억 이상 매매는 상한요율 협의';
    }

    amount = amount * 10000;

    var fees = amount * (rate / 100);
    var originFees = Math.floor(fees);
    if (fees > limitFees) {
        fees = limitFees;
    }
    fees = Math.floor(fees);
    var vat = Math.round(fees * 0.1);

    var html = css + `
        <h2>계산결과</h2>
        <div class="container">
            <div class="column">
                <label>매도금액</label>
                <label class="small">입력값</label>
            </div>
            <div class="vcenter">${commaNumber(amount)}원</div>
        </div>
        <hr>
        <div class="container">
            <div class="column">
                <label>상한요율</label>
                <label class="small">${rateDesc}</label>
            </div>
            <div class="vcenter">${rate}%</div>
        </div>
        <hr>`;

    if (limitFees > 0) {
        html += `<div class="container">
                    <div class="column"><label>한도액</label><label class="small">${limitFeesDesc}</label></div>
                    <div class="vcenter">${commaNumber(limitFees)}원</div>
                </div><hr>`;
    }

    html += `
        <div class="container">
            <div class="column">
                <label>중개수수료</label>
                <label class="small">법정수수료</label>
            </div>
            <div class="vcenter">${commaNumber(fees)}원</div>
        </div>
        <hr>
        <div class="container">
            <div class="column">
                <label>부가세포함</label>
                <label class="small">VAT 10%포함</label>
            </div>
            <div class="vcenter">${commaNumber(fees + vat)}원</div>
        </div>`;

    res.send({
        html: html
    });
}


// router.get('/1', async function(req, res, next) {
//     console.log(req.query);
//     var { contract, building, amount, rent, rate } = req.query;
//     var limitFees = '없음';
//     var originAmount = amount * 10000;
//     var rentDesc = '';
//
//     if (rate == '자동계산') {
//         rate = '';
//     }
//
//
//     if (contract == '매매') {
//         if (building == '주거용') {
//             if (amount < 5000) {    //5천 미만
//                 rate = rate != '' ? rate : 0.6;
//                 limitFees = 250000;
//             } else if (amount >= 5000 && amount < 20000) {  //5천 이상 2억 미만
//                 rate = rate != '' ? rate : 0.5;
//                 limitFees = 800000;
//             } else if (amount >= 20000 && amount < 60000) {  //2억 이상 6억 미만
//                 rate = rate != '' ? rate : 0.4;
//             } else if (amount >= 60000 && amount < 90000) {  //6억 이상 9억 미만
//                 rate = rate != '' ? rate : 0.5;
//             } else if (amount >= 90000) {  //9억 이상
//                 rate = rate != '' ? rate : 0.9;
//             }
//         } else if (building == '토지,상가,오피스텔') {
//             rate = rate != '' ? rate : 0.9;
//         } else if (building == '주거용 오피스텔') {
//             rate = rate != '' ? rate : 0.5;
//         }
//     } else if (contract == '전세') {
//         if (building == '주거용') {
//             if (amount < 5000) {    //5천 미만
//                 rate = rate != '' ? rate : 0.5;
//                 limitFees = 200000;
//             } else if (amount >= 5000 && amount < 10000) {  //5천 이상 1억 미만
//                 rate = rate != '' ? rate : 0.4;
//                 limitFees = 300000;
//             } else if (amount >= 10000 && amount < 30000) {  //1억 이상 3억 미만
//                 rate = rate != '' ? rate : 0.3;
//             } else if (amount >= 30000 && amount < 60000) {  //3억 이상 6억 미만
//                 rate = rate != '' ? rate : 0.4;
//             } else if (amount >= 60000) {  //6억 이상
//                 rate = rate != '' ? rate : 0.8;
//             }
//         } else if (building == '토지,상가,오피스텔') {
//             rate = rate != '' ? rate : 0.9;
//         } else if (building == '주거용 오피스텔') {
//             rate = rate != '' ? rate : 0.4;
//         }
//     } else if (contract == '월세') {
//         if (building == '주거용') {
//             var tmpAmount = amount;
//             amount = eval(amount) + eval(rent * 100);
//             rentDesc = '보증금 + 월세 x 100';
//             if (amount < 5000) {    //5천 미만
//                 rate = rate != '' ? rate : 0.5;
//                 limitFees = 200000;
//                 amount = eval(tmpAmount) + eval(rent * 70);
//                 rentDesc = '보증금 + 월세 x 70';
//             } else if (amount >= 5000 && amount < 10000) {  //5천 이상 1억 미만
//                 rate = rate != '' ? rate : 0.4;
//                 limitFees = 300000;
//             } else if (amount >= 10000 && amount < 30000) {  //1억 이상 3억 미만
//                 rate = rate != '' ? rate : 0.3;
//             } else if (amount >= 30000) {  //3억 이상
//                 rate = rate != '' ? rate : 0.8;
//             }
//         } else if (building == '토지,상가,오피스텔') {
//             var tmpAmount = amount;
//             amount = eval(amount) + eval(rent * 100);
//             rentDesc = '보증금 + 월세 x 100';
//             if (amount < 5000) {    //5천 미만
//                 rate = rate != '' ? rate : 0.9;
//                 amount = eval(tmpAmount) + eval(rent * 70);
//                 rentDesc = '보증금 + 월세 x 70';
//             } else {
//                 rate = rate != '' ? rate : 0.9;
//             }
//         } else if (building == '주거용 오피스텔') {
//             var tmpAmount = amount;
//             amount = eval(amount) + eval(rent * 100);
//             rentDesc = '보증금 + 월세 x 100';
//             if (amount < 5000) {    //5천 미만
//                 rate = rate != '' ? rate : 0.4;
//                 amount = eval(tmpAmount) + eval(rent * 70);
//                 rentDesc = '보증금 + 월세 x 70';
//             } else {
//                 rate = rate != '' ? rate : 0.4;
//             }
//         }
//     }
//
//     amount = amount * 10000;
//
//     var fees = amount * (rate / 100);
//     var originFees = Math.floor(fees);
//     if (fees > limitFees) {
//         fees = limitFees;
//     }
//     fees = Math.floor(fees);
//     var vat = Math.round(fees * 0.1);
//     if (rentDesc) {
//         rentDesc = `
//             <div class="container">
//                 <label>월세</label><div>${ commaNumber(rent * 10000) }원</div>
//             </div>
//             <hr>
//             <div class="container" style='font-size: 12px; margin-bottom: 0px;'>
//                 <label>비고</label><div>${ rentDesc }</div>
//             </div>
//         `;
//     }
//
//     var html = css + `
//         <h2>중개수수료 계산결과</h2>
//         <div class="container">
//             <label>${ contract }가</label><div>${ commaNumber(originAmount) }원</div>
//         </div>
//         ${ rentDesc }
//         <hr>
//         <div class="container">
//             <label>수수료 기준금액</label><div>${ commaNumber(amount) }원</div>
//         </div>
//         <div class="container">
//             <div>수수료 요율</div><div>${ rate }%</div>
//         </div>
//         <div class="container">
//             <div>수수료</div><div>${ commaNumber(originFees) }원</div>
//         </div>
//         <div class="container" style="color: red;">
//             <div>수수료 한도액</div><div>${ limitFees > 0 ? commaNumber(limitFees) + '원' : '없음' }</div>
//         </div>
//         <hr>
//         <div class="container">
//             <div>중개보수료</div><div>${ commaNumber(fees) }원</div>
//         </div>
//         <div class="container">
//             <div>부가세포함</div><div>${ commaNumber(fees + vat) }원</div>
//         </div>
//     `;
//
//     res.send({
//         html: html
//     })
//
// });

router.get('/test', async function(req, res, next) {
    res.render('./fees/test.html');

});

router.post('/1', setLog, async function(req, res, next) {
    console.log(req.body);

});


router.get('/', setLog, async function(req, res, next) {


    // await new Promise(function(resolve, reject) {
    //     var sql = ``;
    //     db.query(sql, function(err, rows, fields) {
    //         console.log(rows);
    //         if (!err) {
    //
    //         } else {
    //             console.log(err);
    //         }
    //     });
    // }).then(function(data) {
    //
    // });


    res.send('1');
});


module.exports = router;
