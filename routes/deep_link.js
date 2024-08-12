const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/", async function (req, res, next) {
    const token = req.query.token;
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Eyedoc deep link</title>
        </head>
        <body>
            <a 
                id="openAppLink" 
                href="intent://dev.eyedocapi.com?token=${token}#Intent;scheme=https;package=com.soft.eyedoc;end"
                style="display: none;"
            >
                Open Android App
            </a>
        <script>
            window.onload = function() {
                setTimeout(() => {
                    document.querySelector("#openAppLink").click();
                }, 200);
            };

            // document.addEventListener("DOMContentLoaded", function() {
            //     window.location.href = "intent://dev.eyedocapi.com#Intent;scheme=https;package=com.soft.eyedoc;end";
            // });
        </script>
        </body>
        </html>
    `;
    res.send(html);
});

module.exports = router;
