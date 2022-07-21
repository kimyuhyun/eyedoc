const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');


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
    }).then(function(data) {
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
    fs.writeFile('./liveuser/' + ip, memo, function(err) {
        console.log(memo);
    });
    //
    next();
}

/**
 * board_id 필수!
 */
router.get('/list/:board_id/:page/:lang', setLog, async function(req, res, next) {
    const board_id = req.params.board_id;
    const id = req.query.id;
    var lang = req.params.lang;

    if (!lang) {
        lang = 'ko';
    }

    var page = req.params.page;
    if (!page) {
        page = 1;
    }
    page = (page - 1) * 20;

    var params = [];
    params.push(lang);
    params.push(board_id);

    var sql = `
        SELECT
            A.idx,
            A.board_id,
            A.id,
            A.title,
            A.memo,
            A.name1,
            A.filename0,
            A.filename1,
            A.filename2,
            A.filename3,
            A.filename4,
            A.filename5,
            A.filename6,
            A.filename7,
            A.filename8,
            A.filename9,
            A.created,
            A.modified,
            A.comment,
            (SELECT COUNT(*) FROM BOARD_tbl WHERE parent_idx = A.idx AND step = 2) as reply_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like1,
            (SELECT COUNT(*) FROM BOARD_SEE_tbl WHERE board_idx = A.idx) as see,
            (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
        FROM BOARD_tbl as A
        WHERE step = 1
        AND is_use = 1
        AND lang = ?
        AND board_id = ? `;
    if (id) {
        sql += ` AND id = ? `;
        params.push(id);
    }
    sql += ` ORDER BY idx DESC `;
    sql += ` LIMIT ${page}, 20 `;
    var arr = await utils.queryResult(sql, params);
    console.log(arr);

    res.send(arr);
});

router.get('/detail/:idx/:id', setLog, async function(req, res, next) {
    const idx = req.params.idx;
    const id = req.params.id;
    var obj = {};

    //조회수 업데이트
    var sql = `SELECT COUNT(*) as cnt FROM BOARD_SEE_tbl WHERE id = ? AND board_idx = ?`;
    var params = [id, idx];
    var arr = await utils.queryResult(sql, params);
    if (arr[0].cnt == 0) {
        sql = `INSERT INTO BOARD_SEE_tbl SET id = ?, board_idx = ?`;
        await utils.queryResult(sql, [id, idx]);
    }
    //

    sql = `
        SELECT
            A.*,
            (SELECT COUNT(*) FROM BOARD_SEE_tbl WHERE board_idx = A.idx) as see,
            (SELECT COUNT(*) FROM BOARD_tbl WHERE parent_idx = A.idx AND step = 2) as reply_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like1,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like1,
            (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
        FROM
        BOARD_tbl as A
        WHERE idx = ?
    `;
    var arr = await utils.queryResult(sql, [id, idx]);
    console.log(arr);
    obj = arr[0];
    res.send(obj);
});

router.get('/reply/:idx/:id/:is_like1_sort', setLog, async function(req, res, next) {
    const idx = req.params.idx;
    const id = req.params.id;
    const is_like1_sort = req.params.is_like1_sort;

    var arr = [];

    var sql = `
        SELECT
            A.idx,
            A.parent_idx,
            A.board_id,
            A.id,
            A.name1,
            A.step,
            A.memo,
            A.filename0,
            A.created,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like1_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like1,
            (SELECT COUNT(*) FROM BOARD_tbl WHERE parent_idx = A.idx AND step = 3) as reply_cnt,
            (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
        FROM BOARD_tbl as A
        WHERE A.step = 2
        AND A.parent_idx = ?
    `;
    if (is_like1_sort == 1) {
        sql += `ORDER BY like1_cnt DESC`;
    } else {
        sql += `ORDER BY A.idx ASC`;
    }
    var params = [id, idx];
    var rtnArr = await utils.queryResult(sql, params);
    var i = 0;
    var step2Arr = [];
    for (obj of rtnArr) {
        i++;
        obj.groups = i;
        step2Arr.push(obj);
    }

    for (obj of step2Arr) {
        arr.push(obj);
        sql = `
            SELECT
            A.idx,
            A.parent_idx,
            A.board_id,
            A.id,
            A.name1,
            A.step,
            A.memo,
            A.filename0,
            A.created,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like1_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like1,
            (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb,
            0 as reply_cnt
            FROM BOARD_tbl as A
            WHERE A.step = 3
            AND A.parent_idx = ?
            ORDER BY A.idx ASC
        `;

        params = [id, obj.idx];
        rtnArr = await utils.queryResult(sql, params);
        for (obj2 of rtnArr) {
            obj2.groups = obj.groups;
            arr.push(obj2);
        }
    }
    res.send(utils.nvl(arr));
});

router.get('/re_reply/:idx/:id', setLog, async function(req, res, next) {
    const idx = req.params.idx;
    const id = req.params.id;

    var arr = [];
    
    var sql = `
        SELECT
            A.idx,
            A.parent_idx,
            A.board_id,
            A.id,
            A.name1,
            A.step,
            A.memo,
            A.filename0,
            A.created,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like1_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like1,
            (SELECT COUNT(*) FROM BOARD_tbl WHERE parent_idx = A.idx AND step = 3) as reply_cnt,
            (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
        FROM BOARD_tbl as A
        WHERE A.step = 2
        AND A.idx = ?
        ORDER BY A.idx ASC
    `;
    var params = [id, idx];
    var rtnArr = await utils.queryResult(sql, params);
    var tmpArr = [];
    var i = 0;
    for (obj of rtnArr) {
        i++;
        obj.groups = i;
        tmpArr.push(obj);
    }

    for (obj of tmpArr) {
        arr.push(obj);

        sql = `
            SELECT
                A.idx,
                A.parent_idx,
                A.board_id,
                A.id,
                A.name1,
                A.step,
                A.memo,
                A.filename0,
                A.created,
                (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like1_cnt,
                (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like1,
                (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb,
                0 as reply_cnt
            FROM BOARD_tbl as A
            WHERE A.step = 3
            AND A.parent_idx = ?
            ORDER BY A.idx ASC
        `;
        var params = [id, obj.idx];
        rtnArr = await utils.queryResult(sql, params);
        for (obj2 of rtnArr) {
            obj2.groups = obj.groups;
            arr.push(obj2);
        }
    }
    res.send(utils.nvl(arr));
});

router.get('/set_like1/:idx/:id', setLog, async function(req, res, next) {
    const idx = req.params.idx;
    const id = req.params.id;
    var cnt = 0;
    var arr = {};

    var sql = `SELECT COUNT(*) as cnt FROM BOARD_LIKE_tbl WHERE board_idx = ? AND id = ?`;
    var params = [idx, id];
    var rtnArr = await utils.queryResult(sql, params);
    cnt = rtnArr[0].cnt;

    if (cnt == 0) {
        sql = `INSERT INTO BOARD_LIKE_tbl SET board_idx = ?, id = ?`;
    } else {
        sql = `DELETE FROM BOARD_LIKE_tbl WHERE board_idx = ? AND id = ?`;
    }
    params = [idx, id];
    await utils.queryResult(sql, params);

    sql = `SELECT COUNT(*) as cnt FROM BOARD_LIKE_tbl WHERE board_idx = ?`;
    params = [idx, id];
    rtnArr = await utils.queryResult(sql, params);
    arr.cnt = rtnArr[0].cnt;

    sql = `SELECT COUNT(*) as cnt FROM BOARD_LIKE_tbl WHERE board_idx = ? AND id = ?`;
    params = [idx, id];
    rtnArr = await utils.queryResult(sql, params);
    arr.is_me = rtnArr[0].cnt;

    res.send(arr);
});


router.get('/set_aricle_push/:parent_idx', setLog, async function(req, res, next) {
    var parent_idx = req.params.parent_idx;
    var dest_id = '';
    var writer = '';
    var board_id = '';
    var step = 0;
    var tmp_idx = 0;

    //항상 상위 댓글 작성자에게 푸시가 날라간다!
    var sql = `SELECT parent_idx, id, board_id, step FROM BOARD_tbl WHERE idx = ?`;
    var params = [parent_idx];
    var rtnArr = await utils.queryResult(sql, params);
    console.log(rtnArr);
    var data = rtnArr[0];
    
    dest_id = data.id;
    tmp_idx = data.parent_idx;
    step = data.step;
    writer = data.id;
    board_id = data.board_id;

    if (step == 2) {
        //최 상위글을 찾는다!!!
        parent_idx = tmp_idx;
        console.log(parent_idx);

        sql = `SELECT idx, id, board_id, step FROM BOARD_tbl WHERE idx = ?`;
        params = [parent_idx];
        rtnArr = await utils.queryResult(sql, params);
        console.log(rtnArr);
        data = rtnArr[0];
        tmp_idx = data.idx;
        writer = data.id;
    }

    await new Promise(function(resolve, reject) {
        var result = utils.sendArticlePush(dest_id, '등록하신 게시물에 댓글이 등록되었습니다.', parent_idx, writer, board_id);
        resolve(result);
    }).then(function(data) {
        res.send({
            data: data
        });
    });
});

module.exports = router;
