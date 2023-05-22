const express = require("express");
const router = express.Router();
const utils = require("../Utils");
const moment = require("moment");
const axios = require("axios");
const urlencode = require("urlencode");

router.get("/op", async function (req, res, next) {
    // res.send('dev');
    // return;
    const sgg = `경남 창원 안경점`;
    const page = 1;

    var config = {
        method: "get",
        url: `https://map.naver.com/v5/api/search?caller=pcweb&type=all&page=${page}&displayCount=100&lang=ko&query=${urlencode(sgg)}`,
        // headers: {
        //     'Cookie': 'NV_WETR_LAST_ACCESS_RGN_M="MDkxNDAxMDQ="; NV_WETR_LOCATION_RGN_M="MDkxNDAxMDQ="; page_uid=2f1af78b-3ff0-4282-be30-6be44818d9b1'
        // }
    };

    const json = await axios(config);

    if (json.data.error) {
        res.send(json.data.error);
        return;
    }

    var list = json.data.result.place.list;

    var resultArr = [];
    resultArr.push(json.data.result.place.totalCount);

    var sql = "";
    for (row of list) {
        sql = `
            INSERT INTO OPTICIAN_tbl SET 
                id = ?,
                name1 = ?,
                tel = ?,
                addr = ?,
                road_addr = ?,
                lat = ?,
                lng = ?,
                created = NOW()
        `;

        var params = [row.id, row.name, row.tel, row.address, row.roadAddress, row.x, row.y];
        var arr = await utils.queryResult(sql, params);
        resultArr.push(arr);
    }
    res.send(resultArr);
});

router.get("/latlng", async (req, res, next) => {
    var sql = `SELECT idx, addr FROM HP_tbl WHERE lat is null`;
    var arr = await utils.queryResult(sql, []);

    for (const obj of arr) {
        try {
            const url = `https://images.lazulsoft.com/geocode/${urlencode(obj.addr)}`;
            const resp = await axios.get(url);
            const data = resp.data;

            console.log(data);

            if (data.LAT) {
                sql = `UPDATE HP_tbl SET lat = ?, lng = ? WHERE idx = ?`;
                arr = await utils.queryResult(sql, [data.LAT, data.LNG, obj.idx]);
                console.log(arr);
            }
        } catch (e) {
            console.log(e.message);
        }
    }
    res.send(200);
});

module.exports = router;
