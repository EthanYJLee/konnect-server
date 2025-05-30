// 환경 변수 설정
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

// 데이터베이스 연결
const connectDB = require("./config/db");
connectDB();

// 앱 설정
const app = require("./app");

// 포트 설정
app.set("port", process.env.PORT || 3030);
app.set("host", process.env.HOST || "0.0.0.0");

// 예외 처리
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// 처리되지 않은 프로미스 예외 처리
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// 서버 실행
app.listen(app.get("port"), app.get("host"), () =>
  console.log(
    "Server is running on : " + app.get("host") + ":" + app.get("port")
  )
);
