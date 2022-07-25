const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');
const percentIle = require('percentile');
// const percentIle = require('stats-percentile');

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

router.get('/is_member/:id', setLog, async function(req, res, next) {
    const id = req.params.id;
    var arr = {};

    var cnt = 0;
    await new Promise(function(resolve, reject) {
        const sql = `SELECT COUNT(*) as cnt FROM MEMB_tbl WHERE id = ?`;
        db.query(sql, id, function(err, rows, fields) {
            if (!err) {
                resolve(rows[0]);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then(function(data) {
        cnt = data.cnt;
    });

    if (cnt > 0) {
        await new Promise(function(resolve, reject) {
            const sql = `SELECT idx, pid, id, name1, birth, gender, email, filename0 FROM MEMB_tbl WHERE id = ?`;
            db.query(sql, id, function(err, rows, fields) {
                console.log(rows);
                if (!err) {
                    resolve(rows[0]);
                } else {
                    console.log(err);
                    res.send(err);
                    return;
                }
            });
        }).then(function(data) {
            if (data) {
                arr = utils.nvl(data);
                arr.code = 1;
            }
        });

        await new Promise(function(resolve, reject) {
            const sql = `SELECT idx, name1, birth, filename0 FROM MEMB_tbl WHERE pid = ? AND is_selected = 1`;
            db.query(sql, [id, id], function(err, rows, fields) {
                console.log(rows);
                if (!err) {
                    resolve(rows[0]);
                } else {
                    console.log(err);
                    res.send(err);
                    return;
                }
            });
        }).then(function(data) {
            if (data) {
                arr.selected_idx = data.idx;
                arr.selected_name1 = data.name1;
                arr.selected_birth = data.birth;
                arr.selected_filename0 = data.filename0;
            } else {
                arr.selected_idx = arr.idx;
                arr.selected_name1 = arr.name1;
                arr.selected_birth = arr.birth;
                arr.selected_filename0 = arr.filename0;
            }
            arr.code = 1;
        });

    } else {
        arr.code = 0;
    }

    res.send(arr);

    //마지막 접속일 업데이트!
    if (arr.code == 1) {
        db.query(`UPDATE MEMB_tbl SET modified = NOW() WHERE id = ?`, id);
    }
    //



});

router.post('/register', setLog, async function(req, res, next) {
    const { id, name1, birth, gender, email } = req.body;

    await new Promise(function(resolve, reject) {
        const sql = `INSERT INTO MEMB_tbl SET pid = ?, id = ?, name1 =?, birth = ?, gender = ?, email = ?, is_selected = 1, created = NOW(), modified = NOW()`;
        db.query(sql, [id, id, name1, birth, gender, email], function(err, rows, fields) {
            if (!err) {
                resolve(rows);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then(function(data) {
        res.send({
            code: 1,
        });
    });
});


router.get('/get_eyes_data_list/:memb_idx', async function(req, res, next) {
    const memb_idx = req.params.memb_idx;
    const limit = req.query.limit;
    var page = req.query.page;

    if (!page) {
        page = 1;
    }

    page = (page - 1) * limit;

    var arr = {};
    var ageArr = [];
    var eyeWashArr = [];

    await new Promise(function(resolve, reject) {
        var sql = `
            SELECT
            idx,
            wdate,
            r_sph,
            r_cyl,
            r_axis,
            l_sph,
            l_cyl,
            l_axis,
            is_eyewash,
            hospital,
            filename0,
            (SELECT birth FROM MEMB_tbl WHERE idx = A.memb_idx) as birth
            FROM EYES_DATA_tbl as A
            WHERE memb_idx = ?
            ORDER BY wdate DESC, created DESC 
            LIMIT ${page}, ${limit} 
        `;
        

        db.query(sql, memb_idx, function(err, rows, fields) {
            if (!err) {
                resolve(rows);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then(function(data) {
        data = utils.nvl(data);
        var r_se = 0;
        var l_se = 0;

        var tmp = '', oldAge = '';

        arr.list = [];

        for (obj of data) {
            tmp = utils.getAge2(obj.birth, obj.wdate.split('-')[0]);
            if (tmp != oldAge) {
                oldAge = tmp;
                obj.age = tmp;
                ageArr.push(obj);
            }

            r_se = eval(obj.r_sph) + eval(obj.r_cyl / 2);
            r_se = r_se.toFixed(2);

            l_se = eval(obj.l_sph) + eval(obj.l_cyl / 2);
            l_se = l_se.toFixed(2);

            obj.r_se = r_se;
            obj.l_se = l_se;

            arr.list.push(obj);

            //안약사용 배열생성
            if (obj.is_eyewash == 1) {
                eyeWashArr.push(tmp);
            }
            //
        }
    });


    var tmpArr = await utils.getLawData();
    var tmpAge = 0;
    var ileObj = {};
    var rIleArr = [];
    var lIleArr = [];

    //나이순으로 정렬!!
    ageArr.sort(function (a, b) {
    	return a.age < b.age ? -1 : a.age > b.age ? 1 : 0;
    });

    eyeWashArr.sort();
    //

    for (obj of ageArr) {
        // console.log(obj.age, obj.r_sph, obj.r_cyl, obj.l_sph, obj.l_cyl);
        var row = await utils.getEyesPer(obj.age, obj.r_sph, obj.r_cyl, obj.l_sph, obj.l_cyl);
        if (obj.age > 18) {
            tmpAge = 18;
        } else {
            tmpAge = obj.age;
        }



        if (row.r_per != 0 && row.l_per != 0) {
            var r_per = 0, l_per = 0;
             r_per = 100 + eval(row.r_per);
             l_per = 100 + eval(row.l_per);
             rIleArr.push({
                 age: tmpAge,
                 val: percentIle(r_per, tmpArr[tmpAge]),
             });

             lIleArr.push({
                 age: tmpAge,
                 val: percentIle(l_per, tmpArr[tmpAge]),
             });
             // lIleObj.
             // rIleArr.push();
             // lIleArr.push(percentIle(l_per, tmpArr[tmpAge]));
        }
    }

    arr.r_ile_arr = rIleArr;
    arr.l_ile_arr = lIleArr;
    arr.eye_wash_arr= eyeWashArr;

    res.send(arr);
});

router.get('/get_eyes_data_datail/:idx', async function(req, res, next) {
    const idx = req.params.idx;
    var arr = [];
    await new Promise(function(resolve, reject) {
        const sql = `
            SELECT
            A.*,
            (SELECT birth FROM MEMB_tbl WHERE idx = A.memb_idx) as birth
            FROM
            EYES_DATA_tbl as A
            WHERE A.idx = ?
        `;
        db.query(sql, idx, function(err, rows, fields) {
            if (!err) {
                resolve(rows[0]);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then(function(data) {
        arr = utils.nvl(data);
    });

    let obj = await utils.getEyesPer(utils.getAge(arr.birth), arr.r_sph, arr.r_cyl, arr.l_sph, arr.l_cyl);
    var tmpArr = await utils.getLawData();
    var rIleArr = [];
    var lIleArr = [];

    // if (obj.r_per != 0 && obj.l_per != 0) {
    var r_per = 0, l_per = 0;
    for (var i=5;i<=18;i++) {
        // var obj = await utils.getEyesPer(i, arr.r_sph, arr.r_cyl, arr.l_sph, arr.l_cyl);
        // console.log(obj);
         r_per = 100 + eval(obj.r_per);
         l_per = 100 + eval(obj.l_per);
console.log(r_per,l_per);
         rIleArr.push(percentIle(r_per, tmpArr[i]));
         lIleArr.push(percentIle(l_per, tmpArr[i]));
    }
    // }

    arr.age = utils.getAge(arr.birth);

    arr.r_ile_arr = rIleArr;
    arr.r_per = obj.r_per;

    arr.l_ile_arr = lIleArr;
    arr.l_per = obj.l_per;

    res.send(arr);

});

router.get('/get_eye_predict/:idx', setLog, async function(req, res, next) {
    const idx = req.params.idx;

    var sql = `
        SELECT
        A.r_sph,
        A.r_cyl,
        A.l_sph,
        A.l_cyl,
        (SELECT birth FROM MEMB_tbl WHERE idx = A.memb_idx) as birth
        FROM
        EYES_DATA_tbl as A
        WHERE A.idx = ?
    `;
    var data = await utils.queryResult(sql, [idx]);
    console.log(data);
    var arr = data[0];

    let obj = await utils.getEyesPer(utils.getAge(arr.birth), arr.r_sph, arr.r_cyl, arr.l_sph, arr.l_cyl);
    var tmpArr = await utils.getLawData();
    var rIleArr = [];
    var lIleArr = [];

    var r_per = 0, l_per = 0, age = utils.getAge(arr.birth);

    if (age < 5 || age > 18) {
        res.send({
            code: 0,
            msg: `만 5세 ~ 만 18세 사이의 데이터만 제공되고 있습니다.`,
        });
        return;
    }
    
    for (var i = 5; i <= 18; i++) {
        if (i >= age) {
            r_per = 100 + eval(obj.r_per);
            l_per = 100 + eval(obj.l_per);
            // console.log(r_per,l_per, i);
            rIleArr.push(percentIle(r_per, tmpArr[i]));
            lIleArr.push(percentIle(l_per, tmpArr[i]));
        }
    }
    
    var rtnObj = {};
    rtnObj.code = 1;
    rtnObj.age = utils.getAge(arr.birth);
    rtnObj.r_ile_arr = rIleArr;
    rtnObj.l_ile_arr = lIleArr;

    res.send(rtnObj);
});

router.get('/is_push/:pid', async function(req, res, next) {
    const pid = req.params.pid;
    var sql = `SELECT is_push FROM MEMB_tbl WHERE pid = ? AND id != '' `;
    var params = [pid];
    var arr = await utils.queryResult(sql, params);
    var obj = arr[0];
    res.send(obj);
});

router.get('/', setLog, async function(req, res, next) {

    // var sql = ``;
    // var params = [];
    // var arr = await utils.queryResult(sql, params);
    // console.log(arr);

    res.send('api');
});




module.exports = router;
