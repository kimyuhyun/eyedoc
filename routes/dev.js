const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async function(req, res, next) {

    // var sql = ``;
    // var params = [];
    // var rtnArr = await utils.queryResult(sql, params);
    // console.log(rtnArr);

    const { data } = await axios({
        url: `https://mvp.lazulsoft.com/token/issue`,
        method: "POST",
    });
    console.log(data);

    res.send('dev');
});



module.exports = router;
