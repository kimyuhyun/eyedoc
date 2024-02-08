process.env.NODE_ENV =
    process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() == "production" ? "production" : "development";

const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const db = require("./common/db");
const cookieParser = require("cookie-parser");
const path = require("path");
const requestIp = require("request-ip");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const noCache = require("nocache");
const app = express();

app.use(
    session({
        key: "sid",
        name: "session-cookie",
        secret: "secret",
        resave: false,
        saveUninitialized: true,
        store: new MySQLStore(db.connAccount),
        // rolling: true,
        cookie: {
            maxAge: 24000 * 3600, // 쿠키 유효기간 24시간
            // httpOnly: false,
        },
    })
);

app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");

app.use(noCache());

// const cspOptions = {
//     directives: {
//         ...helmet.contentSecurityPolicy.getDefaultDirectives(),
//         "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*.unpkg.com"],
//         "img-src": ["'self'", "data:", "https://hongslab-image-server.s3.ap-northeast-2.amazonaws.com", "https://picocss.com"],
//         // 소스에 https와 http 허용
//         "base-uri": ["http:", "https:"],
//     },
// };
// app.use(helmet({ contentSecurityPolicy: cspOptions }));
// app.use(helmet.crossOriginOpenerPolicy()); //Cross-Origin-Opener-Policy 헤더를 설정
// app.use(helmet.crossOriginEmbedderPolicy());
// app.use(helmet.crossOriginResourcePolicy()); //Cross-Origin-Resource-Policy 헤더를 설정

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
);
app.use(helmet.crossOriginResourcePolicy()); //Cross-Origin-Resource-Policy 헤더를 설정
app.use(helmet.dnsPrefetchControl()); //DNS 프리 페치를 비활성화
app.use(helmet.expectCt()); //Expect-CT 헤더를 설정하여 SSL 인증서 오발급을 예방
app.use(helmet.frameguard()); //X-Frame-Options 헤더를 설정하여 clickjacking에 대한 보호를 제공
app.use(helmet.hidePoweredBy()); // X-Powered-By 헤더를 제거
app.use(helmet.hsts()); //서버에 대한 안전한(SSL/TLS를 통한 HTTP) 연결을 적용하는 Strict-Transport-Security 헤더를 설정
app.use(helmet.noSniff()); //X-Content-Type-Options 를 설정하여, 선언된 콘텐츠 유형으로부터 벗어난 응답에 대한 브라우저의 MIME 가로채기를 방지
app.use(helmet.originAgentCluster()); //Origin-Agent-Cluster 헤더를 설정하여 오리진 간 문서를 별도 에이전트 클러스터로 분리
app.use(helmet.permittedCrossDomainPolicies()); //크로스 도메인 콘텐츠 정책을 설정
app.use(helmet.referrerPolicy()); //참조 referrer 헤더를 숨김
app.use(helmet.xssFilter()); // XSS 공격 방지

app.use(logger("dev"));
// app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(requestIp.mw());
app.use(express.json());
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.static(path.join(__dirname, "./client/build")));

app.use("/", require("./routes/index"));
app.use("/dev", require("./routes/dev"));
app.use("/admin", require("./routes/admin"));
app.use("/crud", require("./routes/crud"));
app.use("/article", require("./routes/article"));
app.use("/api", require("./routes/api"));
app.use("/family", require("./routes/family"));
app.use("/excel", require("./routes/excel"));
app.use("/stat", require("./routes/stat"));
app.use("/terms", require("./routes/terms"));
app.use("/terms_web", require("./routes/terms_web"));
app.use("/insight", require("./routes/insight"));
app.use("/auth", require("./routes/auth"));
app.use("/sight_test", require("./routes/sight_test"));
app.use("/crawler", require("./routes/crawler"));
app.use("/hp", require("./routes/hp"));
app.use("/token", require("./routes/token"));
app.use("/upload", require("./routes/upload"));
app.use("/codes", require("./routes/codes"));
app.use("/ocr", require("./routes/ocr"));
app.use("/auto_write", require("./routes/auto_write"));

app.use("/igazy", require("./routes/igazy"));

// error handler
app.use(function (err, req, res, next) {
    console.log("ENV", process.env.NODE_ENV);

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    app.locals.hostname = process.env.HOST_NAME;

    if (process.env.NODE_ENV == "development") {
        console.error(err.stack);
        // render the error page
        res.status(err.status || 500);
        res.render("error");
    }
});

app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

module.exports = app;
