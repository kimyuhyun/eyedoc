const express = require("express");
const router = express.Router();
const axios = require("axios");
const utils = require("../common/utils");
const FormData = require("form-data");
const fs = require("fs");
const multer = require("multer");
const uniqid = require("uniqid");
const path = require("path");
const imageToBase64 = require("image-to-base64");
const { get } = require("express/lib/response");
const { is } = require("express/lib/request");

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const folder = "./public/upload";
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }

            const date = new Date();
            var month = eval(date.getMonth() + 1);
            if (eval(date.getMonth() + 1) < 10) {
                month = "0" + eval(date.getMonth() + 1);
            }
            const dir = `${folder}/${date.getFullYear()}${month}`;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            cb(null, dir);
        },
        filename: function (req, file, cb) {
            const mimeType = path.extname(file.originalname);
            if ("php|phtm|htm|cgi|pl|exe|jsp|asp|inc".includes(mimeType)) {
                cb(null, file.originalname + "x");
                return;
            }

            if ("pdf|ppt|pptx|xls|xlsx|doc|docx|hwp|zip|txt".includes(mimeType)) {
                cb(null, file.originalname);
            } else {
                cb(null, uniqid(file.filename) + "" + mimeType);
            }
        },
        limits: {
            fileSize: 1024 * 1024,
        },
    }),
});

const myUpload = upload.fields([
    { name: "filename0", maxCount: 1 },
    { name: "filename1", maxCount: 1 },
    { name: "filename2", maxCount: 1 },
    { name: "filename3", maxCount: 1 },
    { name: "filename4", maxCount: 1 },
    { name: "filename5", maxCount: 1 },
    { name: "filename6", maxCount: 1 },
    { name: "filename7", maxCount: 1 },
    { name: "filename8", maxCount: 1 },
    { name: "filename9", maxCount: 1 },
]);

router.post("/kakao", myUpload, async function (req, res, next) {
    const file = req.files.filename0[0];

    var frm = new FormData();
    frm.append("image", fs.createReadStream(file.path));

    const { data } = await axios({
        method: "post",
        url: uniqid.process.env.KAKAO_OCR_URL,
        headers: {
            "x-api-key": process.env.KAKAO_OCR_KEY,
            "Content-Type": "multipart/form-data",
            ...frm.getHeaders(),
        },
        data: frm,
    });

    var texts = "";
    for (obj of data.responses[0].results) {
        texts += obj.recognized_word + "\n";
    }
    res.send(texts);
});

router.post("/naver", myUpload, async function (req, res, next) {
    const file = req.files.filename0[0];
    var base64 = await imageToBase64(file.path);
    var query = JSON.stringify({
        version: "V1",
        requestId: "string",
        timestamp: 0,
        lang: "ko",
        images: [
            {
                format: "jpg",
                name: "",
                data: base64,
            },
        ],
    });

    const result = await axios({
        url: process.env.NAVER_OCR_URL,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-OCR-SECRET": process.env.NAVER_OCR_KEY,
        },
        data: query,
    });
    const data = createJson(result.data.images[0].fields);
    // res.send(result.data.images[0].fields);
    data.uploaded_url = `${file.path.replace("public", "")}`;
    res.send(data);
});

router.get("/", async function (req, res, next) {
    const json = JSON.parse(`
        [{"valueType":"ALL","boundingPoly":{"vertices":[{"x":230,"y":54},{"x":316,"y":54},{"x":316,"y":103},{"x":230,"y":103}]},"inferText":"안과","inferConfidence":1},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":325,"y":70},{"x":434,"y":69},{"x":435,"y":97},{"x":325,"y":97}]},"inferText":"안경처방전","inferConfidence":0.9997},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":190,"y":115},{"x":238,"y":114},{"x":239,"y":141},{"x":190,"y":142}]},"inferText":"2일","inferConfidence":0.9416},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":61,"y":149},{"x":180,"y":149},{"x":180,"y":170},{"x":61,"y":169}]},"inferText":"DISTANCE","inferConfidence":0.9992},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":219,"y":149},{"x":240,"y":149},{"x":240,"y":169},{"x":219,"y":169}]},"inferText":"□","inferConfidence":0.1745},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":244,"y":149},{"x":347,"y":149},{"x":347,"y":169},{"x":244,"y":170}]},"inferText":"READING","inferConfidence":1},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":42,"y":181},{"x":88,"y":181},{"x":88,"y":200},{"x":42,"y":200}]},"inferText":"EYE","inferConfidence":1},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":117,"y":181},{"x":161,"y":181},{"x":161,"y":199},{"x":117,"y":199}]},"inferText":"SPH","inferConfidence":1},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":184,"y":181},{"x":229,"y":181},{"x":229,"y":199},{"x":184,"y":199}]},"inferText":"CYL","inferConfidence":0.9983},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":250,"y":180},{"x":301,"y":180},{"x":301,"y":199},{"x":250,"y":199}]},"inferText":"AXIS","inferConfidence":0.9998},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":320,"y":180},{"x":384,"y":180},{"x":384,"y":197},{"x":320,"y":197}]},"inferText":"PRISM","inferConfidence":0.9993},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":410,"y":178},{"x":449,"y":178},{"x":449,"y":189},{"x":410,"y":189}]},"inferText":"BASE","inferConfidence":0.996},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":411,"y":189},{"x":451,"y":189},{"x":451,"y":197},{"x":411,"y":197}]},"inferText":"(V.D.)","inferConfidence":0.9994},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":485,"y":178},{"x":525,"y":178},{"x":525,"y":195},{"x":485,"y":195}]},"inferText":"P.D.","inferConfidence":0.9985},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":48,"y":206},{"x":83,"y":206},{"x":83,"y":226},{"x":48,"y":226}]},"inferText":"OD","inferConfidence":0.993},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":89,"y":205},{"x":174,"y":205},{"x":174,"y":227},{"x":89,"y":227}]},"inferText":"+2,000","inferConfidence":0.9065},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":176,"y":206},{"x":242,"y":204},{"x":243,"y":223},{"x":177,"y":226}]},"inferText":"-25","inferConfidence":0.9498},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":96,"y":231},{"x":172,"y":228},{"x":173,"y":254},{"x":97,"y":257}]},"inferText":"+2,600","inferConfidence":0.8574},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":474,"y":215},{"x":517,"y":215},{"x":517,"y":253},{"x":474,"y":253}]},"inferText":"53","inferConfidence":1},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":518,"y":229},{"x":540,"y":229},{"x":540,"y":237},{"x":518,"y":237}]},"inferText":"mm","inferConfidence":0.9993},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":49,"y":235},{"x":80,"y":235},{"x":80,"y":253},{"x":49,"y":253}]},"inferText":"OS","inferConfidence":0.9939},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":178,"y":230},{"x":242,"y":230},{"x":242,"y":255},{"x":178,"y":255}]},"inferText":"-3,00","inferConfidence":0.9995},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":275,"y":234},{"x":310,"y":234},{"x":310,"y":250},{"x":275,"y":250}]},"inferText":"40","inferConfidence":0.617},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":372,"y":238},{"x":381,"y":238},{"x":381,"y":246},{"x":372,"y":246}]},"inferText":"^","inferConfidence":0.3335},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":33,"y":267},{"x":82,"y":267},{"x":82,"y":287},{"x":33,"y":287}]},"inferText":"ADD","inferConfidence":1},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":126,"y":266},{"x":166,"y":266},{"x":166,"y":287},{"x":126,"y":287}]},"inferText":"P.D","inferConfidence":1},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":237,"y":271},{"x":273,"y":271},{"x":273,"y":283},{"x":237,"y":283}]},"inferText":"mm","inferConfidence":0.9987},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":324,"y":264},{"x":364,"y":264},{"x":364,"y":284},{"x":324,"y":284}]},"inferText":"V.D","inferConfidence":0.9987},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":414,"y":263},{"x":514,"y":263},{"x":514,"y":281},{"x":414,"y":281}]},"inferText":"REMARKS","inferConfidence":0.9999},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":50,"y":297},{"x":85,"y":297},{"x":85,"y":317},{"x":50,"y":317}]},"inferText":"OD","inferConfidence":0.995},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":216,"y":304},{"x":243,"y":304},{"x":243,"y":313},{"x":216,"y":313}]},"inferText":"mm","inferConfidence":0.9989},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":50,"y":324},{"x":81,"y":324},{"x":81,"y":343},{"x":50,"y":343}]},"inferText":"OS","inferConfidence":0.9961},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":217,"y":331},{"x":243,"y":330},{"x":243,"y":339},{"x":218,"y":339}]},"inferText":"mm","inferConfidence":0.9993},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":99,"y":363},{"x":184,"y":363},{"x":184,"y":384},{"x":100,"y":384}]},"inferText":"원장/전문의","inferConfidence":1},{"valueType":"ALL","boundingPoly":{"vertices":[{"x":275,"y":387},{"x":417,"y":387},{"x":417,"y":425},{"x":275,"y":425}]},"inferText":"VENote","inferConfidence":0.9953}]
    `);

    const result = createJson(json);
    res.send(result);
});

function createJson(json) {
    console.log(json);
    const whiteList = ["PD", "SPH", "CYL", "AXIS", "OD", "OS", "R", "L", "우", "좌"];

    //json 데이터에서 화이트리스트와 매칭되는 rect x0,x1,y0,y1 값을 구한다.
    var columns = [];
    for (const o of json) {
        var txt = getUpperReplaceTxt(o.inferText);

        //숫자라면..
        if (isNaN(o.inferText) === false) {
            continue;
        }

        //인식률이 75%이상이면..
        if (o.inferConfidence >= 0.75) {
            for (const col of whiteList) {
                //화이트리스트에 포함된다면..
                if (col.includes(txt) && txt.length > 0) {
                    console.log(col, txt, col.includes(txt));
                    // 이미 존재하는 컬럼명이라면..
                    var isAlready = false;
                    for (const c of columns) {
                        if (c.txt === col) {
                            isAlready = true;
                            break;
                        }
                    }

                    if (!isAlready) {
                        //보정값 +-5 해준다!
                        columns.push({
                            txt: col,
                            x0: o.boundingPoly.vertices[0].x - 5,
                            x1: o.boundingPoly.vertices[1].x + 5,
                            y0: o.boundingPoly.vertices[0].y - 5,
                            y1: o.boundingPoly.vertices[2].y + 5,
                        });
                    }
                }
            }
        }
    }
    console.log("step1", columns);

    //표에서 숫자 데이터만 추출하고 렉트 x의 평균값, y의 평균값을 구해서 배열에 저장 한다!
    const data = [];
    for (const o of json) {
        //숫자 and 인식률이 75%이상이면..
        var txt = getNumberReplaceTxt(o.inferText);

        if (txt.length > 0 && isNaN(txt) === false && o.inferConfidence >= 0.75) {
            const x_sum = o.boundingPoly.vertices[0].x + o.boundingPoly.vertices[1].x;
            const x_avg = x_sum / 2;
            const y_sum = o.boundingPoly.vertices[0].y + o.boundingPoly.vertices[2].y;
            const y_avg = y_sum / 2;
            data.push({
                txt,
                x: x_avg,
                y: y_avg,
            });
        }
    }
    console.log("step2", data);

    const obj = {
        PD: "0",
        SPH: { R: "", L: "" },
        CYL: { R: "", L: "" },
        AXIS: { R: "", L: "" },
    };
    var tmp = 0;
    for (const o of data) {
        //x, y 의 평균값으로 컬럼명을 찾는다.
        const xCol = getFindXColumn(columns, o.x);
        const yCol = getFindYColumn(columns, o.y);

        var txt = getNumberReplaceTxt(o.txt);

        if (xCol !== "" && yCol !== "") {
            console.log(xCol, yCol, txt);
        }

        if (xCol === "PD" || yCol === "PD") {
            //숫자라면
            if (isNaN(txt) === false && txt.length > 0) {
                obj.PD = "" + eval(txt);
            }
            continue;
        }

        if (yCol == "OD" || yCol == "R" || yCol == "우") {
            if (xCol == "SPH") {
                obj.SPH.R = "" + eval(getSignJudgmentNumber(txt)).toFixed(2);
            } else if (xCol == "CYL") {
                obj.CYL.R = "" + eval(getSignJudgmentNumber(txt)).toFixed(2);
            } else if (xCol == "AXIS") {
                obj.AXIS.R = "" + eval(txt).toFixed(0);
            }
        } else if (yCol == "OS" || yCol == "L" || yCol == "좌") {
            if (xCol == "SPH") {
                obj.SPH.L = "" + eval(getSignJudgmentNumber(txt)).toFixed(2);
            } else if (xCol == "CYL") {
                obj.CYL.L = "" + eval(getSignJudgmentNumber(txt)).toFixed(2);
            } else if (xCol == "AXIS") {
                obj.AXIS.L = "" + eval(txt).toFixed(0);
            }
        }
    }
    return obj;
}

function replaceAll(str, searchStr, replaceStr) {
    if (str == "") {
        return str;
    }
    return str.split(searchStr).join(replaceStr);
}

const getUpperReplaceTxt = (txt) => {
    txt = txt.toUpperCase();
    txt = replaceAll(txt, " ", "");
    txt = replaceAll(txt, "]", "");
    txt = replaceAll(txt, "(", "");
    txt = replaceAll(txt, ")", "");
    txt = replaceAll(txt, "M", "");
    txt = replaceAll(txt, ".", "");
    txt = replaceAll(txt, ":", "");
    txt = replaceAll(txt, ",", "");
    txt = replaceAll(txt, "ERE", "");
    txt = replaceAll(txt, "INDER", "");
    txt = replaceAll(txt, "MM", "");
    txt = replaceAll(txt, "안", "");
    return txt;
};

const getNumberReplaceTxt = (txt) => {
    txt = replaceAll(txt, ",", ".");
    txt = replaceAll(txt, "mm", "");

    // 숫자가 아니라면...
    if (isNaN(txt) === true) {
        console.log("숫자가 아님", txt);
    }
    return txt;
};

//+ , - 판단해서 넘겨준다! SPH, CYL 전용!
const getSignJudgmentNumber = (txt) => {
    var tmp = 0;
    if (txt.includes("+")) {
        tmp = eval(txt);
        if (tmp >= 6 && tmp <= 99) {
            tmp = tmp / 10;
        } else if (tmp >= 100 && tmp <= 999) {
            tmp = tmp / 100;
        } else if (tmp >= 1000 && tmp <= 9999) {
            tmp = tmp / 1000;
        }
        return tmp;
    } else if (txt.includes("-")) {
        tmp = eval(txt);
        if (-6 >= tmp && tmp >= -99) {
            tmp = tmp / 10;
        } else if (-100 >= tmp && tmp >= -999) {
            tmp = tmp / 100;
        } else if (-1000 >= tmp && tmp >= -9999) {
            tmp = tmp / 1000;
        }
        return tmp;
    } else {
        tmp = eval(txt) * -1;
        if (-6 >= tmp && tmp >= -99) {
            tmp = tmp / 10;
        } else if (-100 >= tmp && tmp >= -999) {
            tmp = tmp / 100;
        } else if (-1000 >= tmp && tmp >= -9999) {
            tmp = tmp / 1000;
        }
        return tmp;
    }
};

const getFindXColumn = (columns, x) => {
    for (const o of columns) {
        if (o.x0 < x && x < o.x1) {
            return o.txt;
        }
    }
    return "";
};

const getFindYColumn = (columns, y) => {
    for (const o of columns) {
        if (o.y0 < y && y < o.y1) {
            return o.txt;
        }
    }
    return "";
};

function getNearXcolumn(columns, x) {
    let min = 9999;
    let minTxt = "";
    for (const o of columns) {
        const diff = Math.abs(x - o.x);
        if (diff < min) {
            min = diff;
            minTxt = o.txt;
        }
    }
    return minTxt;
}

function getNearYcolumn(columns, y) {
    let min = 9999;
    let minTxt = "";
    for (const o of columns) {
        const diff = Math.abs(y - o.y);
        if (diff < min) {
            min = diff;
            minTxt = o.txt;
        }
    }
    return minTxt;
}

module.exports = router;
