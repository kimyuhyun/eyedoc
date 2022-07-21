const fs = require('fs');
const db = require('./db');
const requestIp = require('request-ip');
const axios = require('axios');
const crypto = require('crypto');
const utils = require('./Utils');

class Utils {
    setSaveMenu(req) {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (req.query.name1 != null) {
                db.query('SELECT * FROM SAVE_MENU_tbl WHERE link = ? AND id = ?', [CURRENT_URL, req.session.mid], function(err, rows, fields) {
                    if (!err) {
                        if (rows.length == 0) {
                            var sql = `
                                INSERT INTO SAVE_MENU_tbl SET
                                id = ?,
                                name1 = ?,
                                link = ? `;
                            db.query(sql, [req.session.mid, req.query.name1, CURRENT_URL], function(err, rows, fields) {
                                console.log(err);
                                self.getSaveMenu(req).then(function(data) {
                                    resolve(data);
                                });
                            });
                        } else {
                            self.getSaveMenu(req).then(function(data) {
                                resolve(data);
                            });
                        }
                    } else {
                        console.log('err', err);
                        res.send(err);
                    }
                });
            } else {
                self.getSaveMenu(req).then(function(data) {
                    resolve(data);
                });
            }
        });
    }

    getSaveMenu(req) {
        return new Promise(function(resolve, reject) {
            if (req.session.mid != null) {
                db.query("SELECT * FROM SAVE_MENU_tbl WHERE id = ?", req.session.mid, function(err, rows, fields) {
                    if (!err) {
                        resolve(rows);
                    } else {
                        console.log('err', err);
                        res.send(err);
                    }
                });
            } else {
                resolve(0);
            }
        });
    }

    async queryResult(sql, params) {
        var arr = [];
        await new Promise(function(resolve, reject) {
            db.query(sql, params, function(err, rows, fields) {
                if (!err) {
                    resolve(rows);
                } else {
                    reject(err);
                }
            });
        }).then(async function(data) {
            arr = data;
        }).catch(function(reason) {
            arr = reason;
        });
        arr = await this.nvl(arr);
        return arr;
    }

    async sendPush(id, msg, menu_flag) {
        var fcmArr = [];
        await new Promise(function(resolve, reject) {
            var sql = "SELECT fcm FROM MEMB_tbl WHERE id = ? AND IS_push = 1 AND is_logout = 0"
            db.query(sql, id, function(err, rows, fields) {
                console.log(rows.length);
                if (!err) {
                    if (rows.length > 0) {
                        resolve(rows[0].fcm);
                    } else {
                        console.log(id + '의 IS_ALARM, IS_LOGOUT 값을 체크해보세요.');
                        return;
                    }
                } else {
                    console.log(err);
                    return;
                }
            });
        }).then(function(data) {
            fcmArr.push(data);
        });

        var fields = {};
        fields['notification'] = {};
        fields['data'] = {};

        fields['registration_ids'] = fcmArr;
        fields['notification']['title'] = 'Mybaby';
        fields['notification']['body'] = msg;
        // fields['notification']['click_action'] = 'NOTI_CLICK'; //액티비티 다이렉트 호출
        fields['priority'] = 'high';
        fields['data']['menu_flag'] = menu_flag;               //키값은 대문자 안먹음..

        var config = {
            method: 'post',
            url: 'https://fcm.googleapis.com/fcm/send',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'key=' + process.env.FCM_SERVER_KEY
            },
            data: JSON.stringify(fields),
        };

        var result = '';

        await new Promise(function(resolve, reject) {
            axios(config).then(function (response) {
                //알림내역저장
                if (response.data.success == 1) {
                    // const sql = "INSERT INTO ALARM_tbl SET ID = ?, MESSAGE = ?, WDATE = NOW()";
                    // db.query(sql, [id, msg]);
                }
                //
                resolve(response.data);
            }).catch(function (error) {
                resolve(error);
            });
        }).then(function(data) {
            result = data;
        });
        return result;
    }

    async sendArticlePush(id, msg, idx, writer, board_id) {
        var fcmArr = [];
        var resultObj = {};
        await new Promise(function(resolve, reject) {
            var sql = "SELECT fcm FROM MEMB_tbl WHERE id = ? AND is_push = 1 AND is_logout = 0"
            db.query(sql, id, function(err, rows, fields) {
                console.log(rows.length);
                if (!err) {
                    if (rows.length > 0) {
                        resolve({
                            code: 1,
                            data: rows[0].fcm,
                        });
                    } else {
                        resolve({
                            code: 0,
                            data: `${id} 의 IS_ALARM, IS_LOGOUT 값을 체크해보세요.`,
                        });
                    }
                } else {
                    console.log(err);
                    resolve({
                        code: 0,
                        data: err,
                    });
                }
            });
        }).then(function(data) {
            resultObj = data;
        });

        if (resultObj.code == 1) {
            fcmArr.push(resultObj.data);
        } else {
            return resultObj.data;
        }


        var fields = {};
        fields['notification'] = {};
        fields['data'] = {};

        fields['registration_ids'] = fcmArr;
        fields['notification']['title'] = '마이베이비';
        fields['notification']['body'] = msg;

        if (board_id == 'growth') {
            fields['notification']['click_action'] = 'growth_detail'; //액티비티 다이렉트 호출
        } else {
            fields['notification']['click_action'] = 'article_detail'; //액티비티 다이렉트 호출
        }

        fields['priority'] = 'high';
        fields['data']['idx'] = idx;
        fields['data']['writer'] = writer;
        fields['data']['board_id'] = board_id;

        var config = {
            method: 'post',
            url: 'https://fcm.googleapis.com/fcm/send',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'key=' + process.env.FCM_SERVER_KEY
            },
            data: JSON.stringify(fields),
        };

        var result = '';

        await new Promise(function(resolve, reject) {
            axios(config).then(function (response) {
                //알림내역저장
                if (response.data.success == 1) {
                    // const sql = "INSERT INTO ALARM_tbl SET ID = ?, MESSAGE = ?, WDATE = NOW()";
                    // db.query(sql, [id, msg]);
                }
                //
                resolve(response.data);
            }).catch(function (error) {
                resolve(error);
            });
        }).then(function(data) {
            result = data;
        });
        return result;
    }

    //null 값은 빈값으로 처리해준다!!
    nvl(arr) {
        try {
            if (arr.length != null) {
                for (var rows of arr) {
                    for (var i in rows) {
                        if (rows[i] == null || rows[i] == 'null') {
                            rows[i] = '';
                        }
                    }
                }
            } else {
                for (var i in arr) {
                    if (arr[i] == null || arr[i] == 'null') {
                        arr[i] = '';
                    }
                }
            }
            return arr;
        } catch (e) {
            return "";
        }
        
    }

    getAge(birth) {
        try {
            var date = new Date();
            var year = date.getFullYear();
            var tmp = birth.split('-')[0];
            var age = year - tmp;
            return age;
        } catch (e) {}
        return "";
        
    }

    getAge2(birth, year) {
        var tmp = birth.split('-')[0];
        var age = year - tmp;
        return age;
    }

    async getLawData() {
        var tmpArr = {};
        await new Promise(function(resolve, reject) {
            const sql = `SELECT * FROM LAWDATA_tbl ORDER BY age ASC, rdata ASC`;
            db.query(sql, function(err, rows, fields) {
                if (!err) {
                    resolve(rows);
                } else {
                    console.log(err);
                    res.send(err);
                    return;
                }
            });
        }).then(function(data) {
            var oldAge = 0;
            for (var obj of data) {
                if (oldAge != obj.age) {
                    oldAge = obj.age;
                    tmpArr[obj.age] = [];
                    tmpArr[obj.age].push(obj.rdata);
                } else {
                    tmpArr[obj.age].push(obj.rdata);
                }
            }
        });
        return tmpArr;
    }

    async getEyesPer(age, r_sph, r_cyl, l_sph, l_cyl) {
        const self = this;

        // console.log(age, r_sph, r_cyl, l_sph, l_cyl);

        if (age > 18) {
            age = 18;
        }

        var r_se = eval(r_sph) + eval(r_cyl / 2);
        r_se = r_se.toFixed(2);

        var l_se = eval(l_sph) + eval(l_cyl / 2);
        l_se = l_se.toFixed(2);

// console.log(r_se, l_se);

        var arr = [];
        await new Promise(function(resolve, reject) {
            const sql = `SELECT rdata FROM LAWDATA_tbl WHERE age = ? ORDER BY rdata ASC`;
            db.query(sql, age, function(err, rows, fields) {
                if (!err) {
                    resolve(rows);
                } else {
                    console.log(err);
                    res.send(err);
                    return;
                }
            });
        }).then(function(data) {
            for (obj of self.nvl(data)) {
                arr.push(obj.rdata);
            }
        });

        if (arr.length > 0) {

            var tmp = 0;
            var r_per = 0;
            var l_per = 0;

            //우안
            try {
                tmp = await self.percentRank(arr, r_se);
            } catch (e) {
                if ((r_se * 100) < 0) {
                    tmp = await self.percentRank(arr, arr[0]);
                } else {
                    tmp = await self.percentRank(arr, arr[arr.length-1]);
                }
            }
            tmp  = await self.formatter(tmp);
            tmp = 1 - tmp;
            r_per = 100 * tmp;
            r_per = r_per * -1;
            //

            //좌안
            try {
                tmp = await self.percentRank(arr, l_se);
            } catch (e) {
                if ((l_se * 100) < 0) {
                    tmp = await self.percentRank(arr, arr[0]);
                } else {
                    tmp = await self.percentRank(arr, arr[arr.length-1]);
                }
            }
            tmp  = await self.formatter(tmp);
            tmp = 1 - tmp;
            l_per = 100 * tmp;
            l_per = l_per * -1;
            //
        } else {
            r_per = 0;
            l_per = 0;
        }

        var obj = {
            r_se: r_se,
            l_se: l_se,
            r_per: r_per.toFixed(1),
            l_per: l_per.toFixed(1),
        };

        return obj;
    }


    async percentRank (arr, value) {
        const self = this;
        var result = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == value) {
                return i / (arr.length - 1);
            }
        }
        let x1, x2, y1, y2;
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] < value && value < arr[i + 1]) {

                x1 = arr[i];
                x2 = arr[i + 1];
                // console.log(x1, x2, (value * 100));
                if ((value * 100) < 0) {
                    result = await self.percentRank2(arr, x1);
                } else {
                    result = await self.percentRank2(arr, x2);
                }
                return result;
            }
        }
        throw new Error('Out of bounds');
    };

    async percentRank2 (arr, v) {
        if (typeof v !== 'number') throw new TypeError('v must be a number');
        for (var i = 0, l = arr.length; i < l; i++) {
            if (v <= arr[i]) {
                while (i < l && v === arr[i]) i++;
                if (i === 0) return 0;
                if (v !== arr[i-1]) {
                    i += (v - arr[i-1]) / (arr[i] - arr[i-1]);
                }
                return i / l;
            }
        }
        return 1;
    }

    async formatter (num) {
        var tmp = '' + num;
        tmp = tmp.split('.');
        if (tmp.length == 1) {
            return num;
        }
        return `${ tmp[0] }.${ tmp[1].substring(0,3) }`;
    }
}

module.exports = new Utils();
