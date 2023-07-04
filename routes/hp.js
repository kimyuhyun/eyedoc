const express = require("express");
const router = express.Router();
const utils = require("../common/utils");
const middleware = require("../common/middleware");

router.get("/", middleware.checkToken, async (req, res, next) => {
    var { search_column, search_value, orderby, page } = req.query;

    var where = `WHERE is_op = 1`;
    var records = [];

    if (search_column && search_value) {
        where += ` AND ?? LIKE ? `;
        records.push(search_column);
        records.push(`%${search_value}%`);
    } else {
        search_column = "";
        search_value = "";
    }

    if (orderby) {
        if (orderby.toLowerCase().includes("delete") || orderby.toLowerCase().includes("update") || orderby.toLowerCase().includes("select")) {
            res.send({ list: [], page_helper: {}, search_column, search_value, orderby });
            return;
        }
    } else {
        orderby = " idx DESC ";
    }

    var sql = `SELECT COUNT(*) as cnt FROM HP_tbl ${where}`;
    var arr = await utils.queryResult(sql, records);
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

    sql = `SELECT idx, name1, addr, lat, lng, is_jehue, created, modified FROM HP_tbl ${where} ORDER BY ${orderby} LIMIT ?, ?`;
    arr = await utils.queryResult(sql, records);
    for (obj of arr) {
        obj.created = utils.utilConvertToMillis(obj.created);
        obj.modified = utils.utilConvertToMillis(obj.modified);
    }
    res.send({
        list: arr,
        page_helper: pageHeler,
        search_column,
        search_value,
        orderby,
    });
});

router.get("/get_hp", middleware.checkToken, async function (req, res, next) {
    const { my_lat, my_lng, lat1, lng1, lat2, lng2, is_sasi_hp } = req.query;

    var sql = `
        SELECT * FROM (
            SELECT
            A.idx,
            A.name1,
            A.addr,
            A.grade,
            A.tel,
            A.lat,
            A.lng,
            A.is_jehue,
            A.is_op,
            (6371*acos(cos(radians(?))*cos(radians(lat))*cos(radians(lng)-radians(?))+sin(radians(?))*sin(radians(lat)))) AS distance
        FROM HP_tbl as A) as Z
        WHERE is_op = 1 AND lat >= ? AND lng >= ? AND lat <= ? AND lng <= ?
    `;
    sql += is_sasi_hp == 1 ? ` AND is_jehue = 1 ` : ``;
    sql += `ORDER BY distance ASC `;
    const params = [my_lat, my_lng, my_lat, lat1, lng1, lat2, lng2];
    const resultArr = await utils.queryResult(sql, params);

    res.send(resultArr);
});

router.get("/get_hp_search", middleware.checkToken, async function (req, res, next) {
    const my_lat = req.query.my_lat;
    const my_lng = req.query.my_lng;
    const is_sasi_hp = req.query.is_sasi_hp;
    const query = `%${req.query.query}%`;

    var sql = `
        SELECT * FROM (
            SELECT
            A.idx,
            A.name1,
            A.addr,
            A.grade,
            A.tel,
            A.lat,
            A.lng,
            A.is_jehue,
            A.is_op,
            (6371*acos(cos(radians(?))*cos(radians(lat))*cos(radians(lng)-radians(?))+sin(radians(?))*sin(radians(lat)))) AS distance
        FROM HP_tbl as A) as Z
        WHERE is_op = 1
        AND lat is NOT NULL 
        AND (name1 LIKE ? OR addr LIKE ?)
        `;
    sql += is_sasi_hp == 1 ? ` AND is_jehue = 1 ` : ``;
    sql += `ORDER BY distance ASC `;

    const params = [my_lat, my_lng, my_lat, query, query];
    const arr = await utils.queryResult(sql, params);
    res.send(arr);
});

router.get("/get_hp/:idx/:memb_id", middleware.checkToken, async function (req, res, next) {
    const idx = req.params.idx;
    const memb_id = req.params.memb_id;
    const sql = `
        SELECT 
            A.idx,
            A.name1,
            A.addr,
            A.tel,
            A.lat,
            A.lng,
            A.is_jehue,
            (SELECT count(*) FROM HP_FAV_tbl WHERE hp_idx = A.idx AND memb_id = ?) as is_fav
        FROM HP_tbl as A
        WHERE idx = ?
    `;
    const arr = await utils.queryResult(sql, [memb_id, idx]);
    const obj = arr[0];

    res.send(obj);
});

router.get("/set_hp_fav/:idx/:memb_id", middleware.checkToken, async function (req, res, next) {
    const idx = req.params.idx;
    const memb_id = req.params.memb_id;
    var sql = `SELECT count(*) as cnt FROM HP_FAV_tbl WHERE hp_idx = ? AND memb_id = ?`;
    var arr = await utils.queryResult(sql, [idx, memb_id]);
    var obj = arr[0];
    if (obj.cnt == 0) {
        sql = `INSERT INTO HP_FAV_tbl SET hp_idx = ?, memb_id = ?`;
        const result = await utils.queryResult(sql, [idx, memb_id]);
        res.send({
            result,
            is_fav: 1,
        });
    } else {
        sql = `DELETE FROM HP_FAV_tbl WHERE hp_idx = ? AND memb_id = ?`;
        const result = await utils.queryResult(sql, [idx, memb_id]);
        res.send({
            result,
            is_fav: 0,
        });
    }
});

module.exports = router;
