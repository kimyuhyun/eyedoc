const CryptoJS = require("crypto-js");

export const getUser = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        const user = JSON.parse(userStr);
        user.id = decrypt(user.id);
        user.idx = decrypt(user.idx);
        user.name1 = decrypt(user.name1);
        user.level1 = decrypt(user.level1);
        return user;
    }
    return null;
};

export const removeUserSession = () => {
    localStorage.removeItem("user");
};

export const setUserSession = (save, user) => {
    if (save.id) {
        save.id = encrypt(save.id.toString());
        save.pw = encrypt(save.pw.toString());
        localStorage.setItem("save", JSON.stringify(save));
    } else {
        localStorage.removeItem("save");
    }
     

    user.id = encrypt(user.id.toString());
    user.idx = encrypt(user.idx.toString());
    user.name1 = encrypt(user.name1.toString());
    user.level1 = encrypt(user.level1.toString());
    localStorage.setItem("user", JSON.stringify(user));
};

export const getSave = () => {
    const saveStr = localStorage.getItem("save");
    if (saveStr) {
        const save = JSON.parse(saveStr);
        save.id = decrypt(save.id);
        save.pw = decrypt(save.pw);
        return save;
    }
    return null;
};

export const utilConvertToMillis = (strTime) => {
    const time = new Date(strTime).getTime() / 1000;
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const inputTime = time;
    const diffTime = currentTime - inputTime;
    var postTime;
    switch (true) {
        case diffTime < 60:
            postTime = "방금";
            break;
        case diffTime < 3600:
            postTime = parseInt(diffTime / 60) + "분 전";
            break;
        case diffTime < 86400:
            postTime = parseInt(diffTime / 3600) + "시간 전";
            break;
        case diffTime < 604800:
            postTime = parseInt(diffTime / 86400) + "일 전";
            break;
        case diffTime > 604800:
            var date = new Date(time * 1000);
            var month = date.getMonth() + 1;
            var day = date.getDate();
            if (date.getMonth() + 1 < 10) {
                month = "0" + date.getMonth() + 1;
            }
            if (date.getDate() < 10) {
                day = "0" + date.getDate();
            }
            postTime = date.getFullYear() + "-" + month + "-" + day;
            break;
        default:
            postTime = time;
    }
    return postTime;
};

export const replaceAll = (str, searchStr, replaceStr) => {
    if (str === "") {
        return str;
    }
    return str.split(searchStr).join(replaceStr);
};

const encrypt = (text) => {
    try {
        const secretkey = "kimluabehappygoo";
        const key = CryptoJS.enc.Utf8.parse(secretkey);
        const iv = CryptoJS.enc.Utf8.parse(secretkey.substring(0, 16));
        const cipherText = CryptoJS.AES.encrypt(`${text}`, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        }).toString();
        return cipherText;
    } catch (err) {
        console.log(err);
        return "";
    }
};

const decrypt = (text) => {
    try {
        const secretkey = "kimluabehappygoo";
        const key = CryptoJS.enc.Utf8.parse(secretkey);
        const iv = CryptoJS.enc.Utf8.parse(secretkey.substring(0, 16));
        const decrypted = CryptoJS.AES.decrypt(`${text}`, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        text = decrypted.toString(CryptoJS.enc.Utf8);
        return text;
    } catch (err) {
        console.log(err);
        return "";
    }
};
