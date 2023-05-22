const aes256Util = require("./aes256Util");

module.exports = {
    getToken: () => {
        const after10s = Math.floor(new Date().getTime()) + process.env.TOKEN_EXPIRE_TIME;
        const token = aes256Util.encrypt(after10s);
        return token;
    },
    getToken10s: () => {
        const after10s = Math.floor(new Date().getTime()) + 10000;
        const token = aes256Util.encrypt(after10s);
        return token;
    },
    checkToken: (token) => {
        const token2 = aes256Util.decrypt(token);
        const now = Math.floor(new Date().getTime());
        if (now < token2) {
            console.log("token ok");
            return true;
        }
        console.log("token fail");
        return false;
    },
};
