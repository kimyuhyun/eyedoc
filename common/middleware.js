const utils = require("./utils");
const tokenManager = require("./tokenManager");
const fs = require("fs");
const moment = require("moment");

const checkToken = async (req, res, next) => {
    const token = req.headers["token"];
    if (!token || !tokenManager.checkToken(token)) {
        res.json({
            code: 0,
            msg: `Your token has expired...`,
        });
        return;
    }

    console.log("@@@@",req.session.name1);

    // if (req.session.name1) {
    //     //브라우저 정보가 같은지 체크!
    //     const browser = req.headers["user-agent"];
    //     const cookie = req.cookies["session-cookie"];
    //     if (!cookie) {
    //         res.json({ code: 0, msg: "cookie error..." });
    //         return;
    //     }
    //     var tmp = cookie.split(".")[0];
    //     tmp = utils.replaceAll(tmp, "s:", "");
    //     const sql = `SELECT data FROM sessions WHERE session_id = ?`;
    //     const arr = await utils.queryResult(sql, [tmp]);
    //     if (!arr[0]) {
    //         res.json({ code: 0, msg: "database error..." });
    //         return;
    //     }
    //     const obj = JSON.parse(arr[0].data);
    //     if (obj.browser != browser) {
    //         res.json({ code: 0, msg: "browser error..." });
    //         return;
    //     }
    // }

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    var sql = `SELECT visit FROM ANALYZER_tbl WHERE ip = ? ORDER BY idx DESC LIMIT 0, 1`;
    const arr = await utils.queryResult(sql, [ip]);
    const obj = arr[0] ?? { visit: 0 };
    const visitCount = obj.visit + 1;

    sql = `INSERT INTO ANALYZER_tbl SET ip = ?, agent = ?, visit = ?, created = NOW()`;
    await utils.queryResult(sql, [ip, req.headers["user-agent"], visitCount]);

    //liveuser 폴더가 없으면 생성
    const dir = "./liveuser";
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    //4분이상 것들 삭제!!
    fs.readdir(`./liveuser`, async function (err, filelist) {
        for (file of filelist) {
            fs.readFile(`./liveuser/${file}`, "utf8", function (err, data) {
                if (file != "dummy") {
                    const tmp = data.split("|S|");
                    // moment.tz.setDefault("Asia/Seoul");
                    const connTime = moment.unix(tmp[0] / 1000).format("YYYY-MM-DD HH:mm");
                    const minDiff = moment.duration(moment(new Date()).diff(moment(connTime))).asMinutes();
                    if (minDiff > 4) {
                        fs.unlink(`./liveuser/${file}`, function (err) {
                            // console.log(err);
                        });
                    }
                }
            });
        }
    });

    //현재 접속자 파일 생성
    const memo = new Date().getTime() + "|S|" + req.baseUrl + req.path;
    fs.writeFile(`./liveuser/${ip}`, memo, function (err) {
        // console.log(err);
    });
    //

    next();
};

module.exports = {
    checkToken,
};
