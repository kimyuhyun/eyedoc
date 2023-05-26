const express = require("express");
const router = express.Router();
const db = require("../common/db");
const utils = require("../common/utils");
const middlewear = require("../common/middleware");

router.get("/:board_id", middlewear.checkToken, async function (req, res, next) {
    const board_id = req.params.board_id;
    var { id, search_column, search_value, orderby, page, is_wrote_only } = req.query;

    var where = `WHERE board_id = ? AND step = 1 AND is_use = 1 `;

    var records = [];
    records.push(board_id);

    if (id && is_wrote_only) {
        where += " AND id = ? ";
        records.push(id);
    }

    if (search_column && search_value) {
        where += ` AND ?? LIKE ? `;
        records.push(search_column);
        records.push(`%${search_value}%`);
    } else {
        search_column = "";
        search_value = "";
    }

    if (orderby) {
        if (orderby.toLowerCase().includes("insert") || orderby.toLowerCase().includes("delete") || orderby.toLowerCase().includes("update") || orderby.toLowerCase().includes("select")) {
            res.send({ code: 0, msg: orderby });
            return;
        }
    } else {
        orderby = " idx DESC ";
    }

    var sql = `
        SELECT count(*) as cnt FROM (
            SELECT 
                A.idx,
                (SELECT COUNT(*) FROM BOARD_BLOCK_tbl WHERE board_idx = A.idx AND id = ?) as is_block
            FROM BOARD_tbl as A ${where}
        ) as Z
        WHERE is_block = 0
    `;
    var arr = await utils.queryResult(sql, [id, ...records]);
    var obj = arr[0];
    if (!obj) {
        res.send({
            list: [],
            page_helper: {},
        });
        return;
    }
    const pageHeler = utils.pageHelper(page, obj.cnt ?? 0);

    records.push(pageHeler.skipSize);
    records.push(pageHeler.contentSize);

    sql = `
        SELECT * FROM (
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
                A.comment,
                A.created,
                A.modified,
                (SELECT COUNT(*) FROM BOARD_tbl WHERE parent_idx = A.idx AND step = 2 AND is_use = 1) as reply_cnt,
                (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like_cnt,
                (SELECT COUNT(*) FROM BOARD_SEE_tbl WHERE board_idx = A.idx) as see_cnt,
                (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like,
                (SELECT COUNT(*) FROM BOARD_BLOCK_tbl WHERE board_idx = A.idx AND id = ?) as is_block,
                (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
            FROM
            BOARD_tbl as A
            ${where}
        ) as Z
        WHERE is_block = 0
        ORDER BY ${orderby}
        LIMIT ?, ?
    `;
    arr = await utils.queryResult(sql, [id, id, ...records]);
    for (obj of arr) {
        obj.created = utils.utilConvertToMillis(obj.created);
        obj.modified = utils.utilConvertToMillis(obj.modified);

        if (obj.id == id) {
            obj.is_modify = 1;
        } else {
            obj.is_modify = 0;
        }
    }
    res.send({
        list: arr,
        page_helper: pageHeler,
        // page: pageHeler.pageNum,
        // board_id,
        // search_column,
        // search_value,
        // orderby,
    });
});

router.get("/:idx/:id", middlewear.checkToken, async function (req, res, next) {
    const idx = req.params.idx;
    const id = req.params.id;

    //조회수 업데이트
    var sql = "SELECT COUNT(*) as cnt FROM BOARD_SEE_tbl WHERE id = ? AND board_idx = ?";
    var arr = await utils.queryResult(sql, [id, idx]);
    var obj = arr[0];
    if (obj.cnt == 0) {
        sql = "INSERT INTO BOARD_SEE_tbl SET id = ?, board_idx = ?";
        arr = await utils.queryResult(sql, [id, idx]);
        // console.log(arr);
    }
    //

    sql = `
        SELECT
        A.*,
        (SELECT COUNT(*) FROM BOARD_tbl WHERE parent_idx = A.idx AND step = 2 AND is_use = 1) as reply_cnt,
        (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like_cnt,
        (SELECT COUNT(*) FROM BOARD_SEE_tbl WHERE board_idx = A.idx) as see_cnt,
        (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like,
        (SELECT COUNT(*) FROM BOARD_BLOCK_tbl WHERE board_idx = A.idx AND id = ?) as is_block,
        (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
        FROM
        BOARD_tbl as A
        WHERE idx = ?
        AND is_use = 1
    `;
    arr = await utils.queryResult(sql, [id, id, idx]);
    obj = arr[0];

    if (!obj) {
        res.send({ code: 0, msg: "존재하지 않는 게시글입니다." });
        return;
    }

    obj.code = 1;

    if (obj.id == id) {
        obj.is_modify = 1;
    }
    
    obj.created = utils.utilConvertToMillis(obj.created);
    obj.modified = utils.utilConvertToMillis(obj.modified);

    res.send(obj);
});

router.get("/reply_list/:idx/:id", async function (req, res, next) {
    const idx = req.params.idx;
    const id = req.params.id;
    const sort1 = req.query.sort1;
    const page = req.query.page || 1;

    //step 2 카운트 구하기!
    var sql2 = "SELECT count(*) as cnt FROM BOARD_tbl WHERE step = 2 AND is_use = 1 AND parent_idx = ?";
    var arr2 = await utils.queryResult(sql2, [idx]);
    var obj2 = arr2[0];
    const pageHelper = utils.pageHelper(page, obj2.cnt ?? 0);

    sql2 = `
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
            A.modified,
            A.is_use,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like,
            (SELECT COUNT(*) FROM BOARD_BLOCK_tbl WHERE board_idx = A.idx AND id = ?) as is_block,
            (SELECT COUNT(*) FROM BOARD_tbl WHERE parent_idx = A.idx AND step = 3 AND is_use = 1) as reply_cnt,
            (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
        FROM BOARD_tbl as A
        WHERE A.step = 2
        AND is_use = 1 
        AND A.parent_idx = ?
        ORDER BY A.idx DESC
        LIMIT ?, ?
    `;

    arr2 = await utils.queryResult(sql2, [id, id, idx, pageHelper.skipSize, pageHelper.contentSize]);
    if (sort1 == "time") {
        arr2.reverse();
    }

    const newArr = [];
    for (obj2 of arr2) {
        obj2.group_id = obj2.idx;
        obj2.created = utils.utilConvertToMillis(obj2.created);
        obj2.modified = utils.utilConvertToMillis(obj2.modified);
        if (obj2.id == id) {
            obj2.is_modify = 1;
        } else {
            obj2.is_modify = 0;
        }
        newArr.push(obj2);

        // step 3의 카운트 구하기!
        var sql3 = `SELECT count(*) as cnt FROM BOARD_tbl WHERE parent_idx = ? AND STEP = 3 AND is_use = 1`;
        var arr3 = await utils.queryResult(sql3, [obj2.idx]);
        var obj3 = arr3[0];

        sql3 = `
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
                A.modified,
                A.is_use,
                (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like_cnt,
                (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like,
                (SELECT COUNT(*) FROM BOARD_BLOCK_tbl WHERE board_idx = A.idx AND id = ?) as is_block,
                (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb,
                0 as reply_cnt
            FROM BOARD_tbl as A
            WHERE A.step = 3
            AND A.is_use = 1 
            AND A.parent_idx = ?
            ORDER BY A.idx ASC
        `;

        if (obj3.cnt > 3) {
            sql3 += ` LIMIT 3 OFFSET ${obj3.cnt - 3}`;
            newArr.push({
                group_id: obj2.idx,
                idx: obj2.idx,
                parent_idx: "",
                board_id: "",
                id: "",
                name1: "",
                step: 4,
                memo: `이전 대댓글  ${obj3.cnt - 3}개 더보기`,
                filename0: "",
                created: "",
                modified: "",
                is_use: 1,
                like_cnt: 0,
                is_like: 0,
                is_block: 0,
                reply_cnt: 0,
                user_thumb: "",
                is_modify: 0,
            });
        }

        arr3 = await utils.queryResult(sql3, [id, id, obj2.idx]);
        for (obj3 of arr3) {
            obj3.group_id = obj2.idx;
            obj3.created = utils.utilConvertToMillis(obj3.created);
            obj3.modified = utils.utilConvertToMillis(obj3.modified);
            if (obj3.id == id) {
                obj3.is_modify = 1;
            } else {
                obj3.is_modify = 0;
            }
            newArr.push(obj3);
        }
    }

    res.send({
        list: newArr,
        page_helper: pageHelper,
    });
});

router.get("/reply_detail/:parent_idx/:id", async function (req, res, next) {
    const parent_idx = req.params.parent_idx;
    const id = req.params.id;

    var sql2 = "";
    var arr2 = [];
    var obj2 = {};

    sql2 = `
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
            A.modified,
            A.is_use,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like,
            (SELECT COUNT(*) FROM BOARD_BLOCK_tbl WHERE board_idx = A.idx AND id = ?) as is_block,
            (SELECT COUNT(*) FROM BOARD_tbl WHERE parent_idx = A.idx AND step = 3 AND is_use = 1) as reply_cnt,
            (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
        FROM BOARD_tbl as A
        WHERE A.step = 2
        AND A.is_use = 1 
        AND A.idx = ?
    `;
    arr2 = await utils.queryResult(sql2, [id, id, parent_idx]);
    obj2 = arr2[0];

    const newArr = [];

    if (!obj2) {
        res.send({ list: [] });
        return;
    }

    obj2.group_id = obj2.idx;
    obj2.created = utils.utilConvertToMillis(obj2.created);
    obj2.modified = utils.utilConvertToMillis(obj2.modified);
    if (obj2.id == id) {
        obj2.is_modify = 1;
    } else {
        obj2.is_modify = 0;
    }
    newArr.push(obj2);

    var sql3 = `
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
            A.modified,
            A.is_use,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx) as like_cnt,
            (SELECT COUNT(*) FROM BOARD_LIKE_tbl WHERE board_idx = A.idx AND id = ?) as is_like,
            (SELECT COUNT(*) FROM BOARD_BLOCK_tbl WHERE board_idx = A.idx AND id = ?) as is_block,
            0 as reply_cnt,
            (SELECT filename0 FROM MEMB_tbl WHERE id = A.id) as user_thumb
        FROM BOARD_tbl as A
        WHERE A.step = 3
        AND A.is_use = 1 
        AND A.parent_idx = ?
        ORDER BY A.idx ASC
    `;
    arr3 = await utils.queryResult(sql3, [id, id, obj2.idx]);

    for (const obj3 of arr3) {
        obj3.group_id = obj2.idx;
        obj3.created = utils.utilConvertToMillis(obj3.created);
        obj3.modified = utils.utilConvertToMillis(obj3.modified);
        if (obj3.id == id) {
            obj3.is_modify = 1;
        } else {
            obj3.is_modify = 0;
        }
        newArr.push(obj3);
    }

    res.send({ list: newArr });
});

router.get("/set_like/:idx/:id", middlewear.checkToken, async function (req, res, next) {
    const idx = req.params.idx;
    const id = req.params.id;
    var cnt = 0;

    var sql = `SELECT COUNT(*) as cnt FROM BOARD_LIKE_tbl WHERE board_idx = ? AND id = ?`;
    var arr = await utils.queryResult(sql, [idx, id]);
    var obj = arr[0];
    if (obj) {
        cnt = obj.cnt;
    }

    if (cnt == 0) {
        sql = `INSERT INTO BOARD_LIKE_tbl SET board_idx = ?, id = ?`;
    } else {
        sql = `DELETE FROM BOARD_LIKE_tbl WHERE board_idx = ? AND id = ?`;
    }
    await utils.queryResult(sql, [idx, id]);

    sql = `SELECT COUNT(*) as cnt FROM BOARD_LIKE_tbl WHERE board_idx = ?`;
    arr = await utils.queryResult(sql, [idx]);
    obj = arr[0];
    var like_cnt = 0;
    if (obj) {
        like_cnt = obj.cnt;
    }

    sql = `SELECT COUNT(*) as cnt FROM BOARD_LIKE_tbl WHERE board_idx = ? AND id = ?`;
    arr = await utils.queryResult(sql, [idx, id]);
    obj = arr[0];
    var is_like = 0;
    if (obj) {
        is_like = obj.cnt;
    }
    res.send({
        like_cnt,
        is_like,
    });
});

router.get("/set_aricle_push/:parent_idx", middlewear.checkToken, async function (req, res, next) {
    var parent_idx = req.params.parent_idx;
    var dest_id = "";
    var writer = "";
    var board_id = "";
    var step = 0;
    var tmp_idx = 0;

    //항상 상위 댓글 작성자에게 푸시가 날라간다!
    await new Promise(function (resolve, reject) {
        var sql = `SELECT parent_idx, id, board_id, step FROM BOARD_tbl WHERE idx = ? `;
        db.query(sql, parent_idx, function (err, rows, fields) {
            if (!err) {
                resolve(rows[0]);
            } else {
                console.log(err);
            }
        });
    }).then(function (data) {
        dest_id = data.id;

        tmp_idx = data.parent_idx;
        step = data.step;
        writer = data.id;
        board_id = data.board_id;
    });

    if (step == 2) {
        //최 상위글을 찾는다!!!
        parent_idx = tmp_idx;

        console.log(parent_idx);

        await new Promise(function (resolve, reject) {
            var sql = `SELECT idx, id, board_id, step FROM BOARD_tbl WHERE idx = ? `;
            db.query(sql, parent_idx, function (err, rows, fields) {
                if (!err) {
                    resolve(rows[0]);
                } else {
                    console.log(err);
                }
            });
        }).then(function (data) {
            tmp_idx = data.idx;
            writer = data.id;
        });
    }

    await new Promise(function (resolve, reject) {
        var result = utils.sendArticlePush(dest_id, "등록하신 게시물에 댓글이 등록되었습니다.", parent_idx, writer, board_id);
        resolve(result);
    }).then(function (data) {
        res.send({
            data: data,
        });
    });
});

module.exports = router;
