const express = require("express");
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");
const utils = require("../common/utils");

/*
 * 더미 이미지 리스트
 * https://cdn.jumpit.co.kr/images/114599/20231302081355378_564_856.jpg
 * https://cdn.jumpit.co.kr/images/114599/20231502081524941_1080_1619.jpeg
 * https://cdn.jumpit.co.kr/images/114599/20231502081547824_1080_720.jpeg
 * https://cdn.jumpit.co.kr/images/114599/20231602081621242_1080_1350.jpeg
 * https://cdn.jumpit.co.kr/images/114599/20231602081649314_1080_1440.jpeg
 * https://cdn.jumpit.co.kr/images/114599/20231902081943171_5433_3259.jpg
 * https://cdn.jumpit.co.kr/images/114599/20232302082338414_5197_3425.jpeg
 */
const imgArr = [
    "https://cdn.jumpit.co.kr/images/114599/20231302081355378_564_856.jpg",
    "https://cdn.jumpit.co.kr/images/114599/20231502081524941_1080_1619.jpeg",
    "https://cdn.jumpit.co.kr/images/114599/20231502081547824_1080_720.jpeg",
    "https://cdn.jumpit.co.kr/images/114599/20231602081621242_1080_1350.jpeg",
    "https://cdn.jumpit.co.kr/images/114599/20231602081649314_1080_1440.jpeg",
    "https://cdn.jumpit.co.kr/images/114599/20231902081943171_5433_3259.jpg",
    "https://cdn.jumpit.co.kr/images/114599/20232302082338414_5197_3425.jpeg",
];

router.get("/", async function (req, res, next) {
    try {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "'눈 건강에 관한' 에 관한 SNS 글 써줘!" }],
        });
        console.log(completion.data.choices[0].message);

        const user = completion.data.choices[0].message.role;
        const memo = completion.data.choices[0].message.content;
        const title = memo.substring(0, 20);

        const random = Math.floor(Math.random() * imgArr.length);

        const sql = `
            INSERT INTO BOARD_tbl SET
                lang = 'ko',
                board_id = 'comm',
                id = ?,
                name1 = ?,
                title = ?,
                memo = ?,
                filename0 = ?,
                created = NOW(),
                modified = NOW()
        `;
        const arr = await utils.queryResult(sql, ["gpt-3.5", "gpt-3.5", title, memo, imgArr[random]]);
        console.log(arr);
    } catch (err) {
        console.log("err", err.message);
    }

    res.send(`
        <script>setTimeout(function(){location.reload();}, 10000);</script>
    `);
});

module.exports = router;
