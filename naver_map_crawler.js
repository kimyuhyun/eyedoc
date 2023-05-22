const db = require('./db');
const utils = require('./Utils');
const axios = require('axios');
const urlencode = require('urlencode');


//경남, 부산, 울산, 전남 까지 함!

main(process.argv[2], process.argv[3]);

async function main(sgg, page) {
    var tmp = sgg.split('-');
    sgg = '';
    for (txt of tmp) {
        sgg += `${txt} `;
    }
    sgg = sgg.trim();

    console.log(sgg, page);

    var config = {
        method: 'get',
        url: `https://map.naver.com/v5/api/search?caller=pcweb&type=all&page=${page}&displayCount=100&lang=ko&query=${urlencode(sgg)}`,
        // headers: {
        //     'Cookie': 'NV_WETR_LAST_ACCESS_RGN_M="MDkxNDAxMDQ="; NV_WETR_LOCATION_RGN_M="MDkxNDAxMDQ="; page_uid=2f1af78b-3ff0-4282-be30-6be44818d9b1'
        // }
    };
      
    const json = await axios(config);
    
    if (json.data.error) {
        console.log(json.data.error);
        return;
    }

    var list = json.data.result.place.list;
    
    var resultArr = [];
    resultArr.push(json.data.result.place.totalCount);

    var sql = '';
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
    console.log(resultArr);
    process.exit(1);
}