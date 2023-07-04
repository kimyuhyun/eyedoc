const express = require("express");
const router = express.Router();
const tokenManager = require("../common/tokenManager");

router.post("/issue", async function (req, res, next) {
    //user-agent 체크!
    console.log(req.headers);
    const agent = req.headers["user-agent"];
    if (agent.includes("Post") || agent.includes("axios") || agent.includes("curl")) {
        res.json({ code: 0, msg: "토큰을 발급할 수 없습니다." });
        return;
    }

    //origin 체크!
    const origin = req.headers["origin"];
    if (origin != process.env.HOST_NAME) {
        res.json({ code: 0, msg: "토큰을 발급할 수 없습니다. error origin" });
        return;
    }

    const token = tokenManager.getToken();
    res.send({ token });
});

module.exports = router;
