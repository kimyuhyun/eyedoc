const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const fs = require("fs");
const db = require("../common/db");
const utils = require("../common/utils");
const moment = require("moment");
const percentIle = require("percentile");
const middleware = require("../common/middleware");
const requestIp = require("request-ip");

router.get("/", middleware.checkToken, async function (req, res, next) {
    res.send({
        title: "Eyedoc api",
        ip: requestIp.getClientIp(req),
        mode: process.env.NODE_ENV,
        session: req.session,
    });
});

router.get("/is_member/:id", middleware.checkToken, async function (req, res, next) {
    const id = req.params.id;
    var arr = {};

    var cnt = 0;
    var sql = `SELECT COUNT(*) as cnt FROM MEMB_tbl WHERE id = ?`;
    var arr = await utils.queryResult(sql, [id]);
    var obj = arr[0];
    cnt = obj.cnt ?? 0;

    if (cnt > 0) {
        sql = `SELECT idx, pid, id, name1, birth, gender, email, filename0 FROM MEMB_tbl WHERE id = ?`;
        arr = await utils.queryResult(sql, [id]);
        obj = arr[0];
        obj = utils.nvl(obj);

        sql = `SELECT idx, name1, birth, filename0 FROM MEMB_tbl WHERE pid = ? AND is_selected = 1`;
        arr = await utils.queryResult(sql, [id]);
        var obj2 = arr[0];

        if (obj2) {
            obj.selected_idx = obj2.idx;
            obj.selected_name1 = obj2.name1;
            obj.selected_birth = obj2.birth;
            obj.selected_filename0 = obj2.filename0;
        } else {
            obj.selected_idx = obj.idx;
            obj.selected_name1 = obj.name1;
            obj.selected_birth = obj.birth;
            obj.selected_filename0 = obj.filename0;
        }
        obj.code = 1;
    } else {
        obj.code = 0;
    }

    res.send(obj);

    //마지막 접속일 업데이트!
    if (obj.code == 1) {
        db.query(`UPDATE MEMB_tbl SET modified = NOW() WHERE id = ?`, id);
    }
    //
});

router.post("/register", middleware.checkToken, async function (req, res, next) {
    const { id, name1, birth, gender, email } = req.body;

    await new Promise(function (resolve, reject) {
        const sql = `INSERT INTO MEMB_tbl SET pid = ?, id = ?, name1 =?, birth = ?, gender = ?, email = ?, is_selected = 1, created = NOW(), modified = NOW()`;
        db.query(sql, [id, id, name1, birth, gender, email], function (err, rows, fields) {
            if (!err) {
                resolve(rows);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then(function (data) {
        res.send({
            code: 1,
        });
    });
});

router.get("/get_eyes_data_list/:memb_idx", middleware.checkToken, async function (req, res, next) {
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

    await new Promise(function (resolve, reject) {
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

        db.query(sql, memb_idx, function (err, rows, fields) {
            if (!err) {
                resolve(rows);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then(function (data) {
        data = utils.nvl(data);
        var r_se = 0;
        var l_se = 0;

        var tmp = "",
            oldAge = "";

        arr.list = [];

        for (var obj of data) {
            tmp = utils.getAge2(obj.birth, obj.wdate.split("-")[0]);
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
            var r_per = 0,
                l_per = 0;
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
    arr.eye_wash_arr = eyeWashArr;

    res.send(arr);
});

router.get("/get_eyes_data_datail/:idx", middleware.checkToken, async function (req, res, next) {
    const idx = req.params.idx;
    var arr = [];
    await new Promise(function (resolve, reject) {
        const sql = `
            SELECT
            A.*,
            (SELECT birth FROM MEMB_tbl WHERE idx = A.memb_idx) as birth
            FROM
            EYES_DATA_tbl as A
            WHERE A.idx = ?
        `;
        db.query(sql, idx, function (err, rows, fields) {
            if (!err) {
                resolve(rows[0]);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then(function (data) {
        arr = utils.nvl(data);
    });

    let obj = await utils.getEyesPer(utils.getAge(arr.birth), arr.r_sph, arr.r_cyl, arr.l_sph, arr.l_cyl);
    var tmpArr = await utils.getLawData();
    var rIleArr = [];
    var lIleArr = [];

    // if (obj.r_per != 0 && obj.l_per != 0) {
    var r_per = 0,
        l_per = 0;
    for (var i = 5; i <= 18; i++) {
        // var obj = await utils.getEyesPer(i, arr.r_sph, arr.r_cyl, arr.l_sph, arr.l_cyl);
        // console.log(obj);
        r_per = 100 + eval(obj.r_per);
        l_per = 100 + eval(obj.l_per);
        console.log(r_per, l_per);
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

router.get("/get_eye_predict/:idx", middleware.checkToken, async function (req, res, next) {
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

    var r_per = 0,
        l_per = 0,
        age = utils.getAge(arr.birth);

    if (age < 5) {
        res.send({
            code: 0,
            msg: `만 5세 이상의 데이터만 제공되고 있습니다.`,
        });
        return;
    }

    if (age <= 18) {
        for (var i = 5; i <= 18; i++) {
            if (i >= age) {
                r_per = 100 + eval(obj.r_per);
                l_per = 100 + eval(obj.l_per);
                // console.log(r_per,l_per, i);
                rIleArr.push(percentIle(r_per, tmpArr[i]));
                lIleArr.push(percentIle(l_per, tmpArr[i]));
            }
        }
    } else {
        for (var i = age; i <= age + 10; i++) {
            r_per = 100 + eval(obj.r_per);
            l_per = 100 + eval(obj.l_per);
            //18세 초과 이므로!! 무조건 18세로 픽스해서 데이터 계산한다!
            rIleArr.push(percentIle(r_per, tmpArr[18]));
            lIleArr.push(percentIle(l_per, tmpArr[18]));
        }
    }

    var rtnObj = {};
    rtnObj.code = 1;
    rtnObj.age = utils.getAge(arr.birth);
    rtnObj.r_ile_arr = rIleArr;
    rtnObj.l_ile_arr = lIleArr;

    res.send(rtnObj);
});

router.get("/home_marquee_text", middleware.checkToken, async function (req, res, next) {
    const sql = `SELECT memo FROM BOARD_tbl WHERE board_id ='marquee' ORDER BY idx DESC LIMIT 1`;
    const arr = await utils.queryResult(sql, []);
    const obj = arr[0];
    obj.code = 1;
    res.json(obj);

});

router.get("/is_push/:pid", async function (req, res, next) {
    const pid = req.params.pid;
    var sql = `SELECT is_push FROM MEMB_tbl WHERE pid = ? AND id != '' `;
    var params = [pid];
    var arr = await utils.queryResult(sql, params);
    var obj = arr[0];
    res.send(obj);
});

module.exports = router;
