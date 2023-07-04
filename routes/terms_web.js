const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/use_terms", async function (req, res, next) {
    const { data } = await axios({ url: `${process.env.HOST_NAME}/terms/use_terms` });

    const html = `
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>아이닥</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
    </head>
    <body class="bg-light">
        <div class="container">
            <div class="card shadow m-3">
                <div class="card-body">
                    <h2 class="card-title">${data.title}</h2>
                    <p class="card-text" style="white-space: pre-wrap;">${data.memo}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

router.get("/policy", async function (req, res, next) {
    const { data } = await axios({ url: `${process.env.HOST_NAME}/terms/policy` });

    const html = `
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>아이닥</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
    </head>
    <body class="bg-light">
        <div class="container">
            <div class="card shadow m-3">
                <div class="card-body">
                    <h2 class="card-title">${data.title}</h2>
                    <p class="card-text" style="white-space: pre-wrap;">${data.memo}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});


router.get("/account_delete_request_policy", (req, res, next) => {
    const html = `
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>아이닥</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
    </head>
    <body class="bg-light">
        <div class="container">
            <div class="card shadow m-3">
                <div class="card-body">
                    <h2 class="card-title">나의 계정 및 데이터는 어떻게 삭제합니까?</h2>
                    <p class="card-text">
                        계정을 삭제하려면 다음 단계를 따르세요. 떠나시다니 유감입니다 🙁

                        <ol>
                            <li>어플리케이션 하단 탭에서 "더보기"를 탭하세요.</li>
                            <li>오른쪽 위의 ⚙ 를 탭하세요.</li>
                            <li>"회원탈퇴" 탭하세요.</li>
                            <li>단계에 따라 계정을 삭제하십시오.</li>
                        </ol>

                        <ul>
                            <li>서비스 탈퇴후 30일 간 데이터가 보관 됩니다.</li>
                            <li>30일이 지나면 계정을 더 이상 복구할 수 없으며 계정 삭제 프로세스가 시작됩니다.</li>
                            <li>즉, 사용자 데이터베이스의 계정및 모든 데이터가 삭제됩니다.</li>
                            <li>특정 법적, 보안 및 비즈니스 요구를 위해 일부 개인 데이터를 보유할 수 있습니다.</li>
                        </ul>
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

module.exports = router;
