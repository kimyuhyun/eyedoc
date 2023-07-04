const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../common/db');
const utils = require('../common/utils');
const moment = require('moment');
const percentIle = require('percentile');
// const percentIle = require('stats-percentile');
const middleware = require("../common/middleware");


router.get('/get_family_list/:pid', middleware.checkToken, async function(req, res, next) {
    const pid = req.params.pid;

    const sql = `SELECT idx, id, name1, birth, gender, is_selected, filename0 FROM MEMB_tbl WHERE pid = ? ORDER BY birth ASC`;
    const arr = await utils.queryResult(sql, [pid]);
    for (const obj of arr) {
        if (obj.id == pid) {
            obj.is_me = 1;
        } else {
            obj.is_me = 0;
        }
    }
    res.send(arr);
});

router.get('/get_family_detail/:idx', middleware.checkToken, async function(req, res, next) {
    const idx = req.params.idx;

    var arr = {};
    await new Promise(function(resolve, reject) {
        const sql = `SELECT idx, id, name1, birth, gender, filename0 FROM MEMB_tbl WHERE idx = ?`;
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
    res.send(arr);
});

router.get('/get_family_select_check/:pid', middleware.checkToken, async function(req, res, next) {
    const pid = req.params.pid;

    await new Promise(function(resolve, reject) {
        const sql = `SELECT COUNT(*) as cnt FROM MEMB_tbl WHERE is_selected = 1 AND pid = ?`;
        db.query(sql, pid, function(err, rows, fields) {
            if (!err) {
                resolve(rows[0]);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then(function (data) {
        res.send({ cnt: data.cnt });
    });
});


router.post('/set_family_select', middleware.checkToken, async function(req, res, next) {
    const { pid, idx } = req.body;

    await new Promise(function(resolve, reject) {
        const sql = `UPDATE MEMB_tbl SET is_selected = 0 WHERE pid = ?`;
        db.query(sql, pid, function(err, rows, fields) {
            if (!err) {
                resolve(rows);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then();

    await new Promise(function(resolve, reject) {
        const sql = `UPDATE MEMB_tbl SET is_selected = 1 WHERE pid = ? AND idx = ?`;
        db.query(sql, [pid, idx], function(err, rows, fields) {
            if (!err) {
                resolve(rows);
            } else {
                console.log(err);
                res.send(err);
                return;
            }
        });
    }).then();

    var arr = {};
    await new Promise(function(resolve, reject) {
        const sql = `SELECT id, idx, name1, birth, filename0 FROM MEMB_tbl WHERE pid = ? AND is_selected = 1`;
        db.query(sql, pid, function(err, rows, fields) {
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

    if (arr.id == pid) {
        arr.is_me = 1;
    } else {
        arr.is_me = 0;
    }

    res.send(arr);
});

router.get('/del_family/:pid/:idx', middleware.checkToken, async function(req, res, next) {
    const { pid, idx } = req.params;

    //가족이 1명은 있어야 하므로 체크한다!
    var sql = `SELECT COUNT(*) as cnt FROM MEMB_tbl WHERE pid = ? AND id = ''`;
    var arr = await utils.queryResult(sql, [pid]);
    var cnt = arr[0].cnt;

    if (cnt == 1) {
        res.send({
            code: 0,
            msg: '최소 가족은 1명은 있어야 합니다.',
        });
    } else {
        //삭제하고!
        sql = `DELETE FROM MEMB_tbl WHERE pid = ? AND idx = ?`;
        arr = await utils.queryResult(sql, [pid, idx]);

        //is_selected 가 있는지 검색
        sql = `SELECT idx, name1, filename0, birth, COUNT(*) as cnt FROM MEMB_tbl WHERE is_selected = 1 AND pid = ?`;
        arr = await utils.queryResult(sql, [pid]);
        cnt = arr[0].cnt;
        var obj = {};
        if (cnt == 0) {
            sql = `SELECT idx, name1, filename0, birth FROM MEMB_tbl WHERE pid = ? AND id = '' LIMIT 0, 1`;
            arr = await utils.queryResult(sql, [pid]);
            obj = arr[0];
            sql = `UPDATE MEMB_tbl SET is_selected = 1 WHERE pid = ? AND idx = ?`;
            await utils.queryResult(sql, [pid, obj.idx]);
        } else {
            obj = arr[0];
        }
        res.send({
            code: 1,
            msg: '삭제 되었습니다.',
            idx: obj.idx,
            name1: obj.name1,
            filename0: obj.filename0,
            birth: obj.birth,
        });
    }
});





module.exports = router;