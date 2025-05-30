const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
require("./config/passport");
// 라우트
const authRoutes = require("./routes/authRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const historyRoutes = require("./routes/historyRoutes");
// const searchRoutes = require("./routes/search");
// const naverSearchRoutes = require("./routes/naverSearch");
const googleSearchRoutes = require("./routes/googleSearchRoutes");
const nominatimSearchRoutes = require("./routes/nominatimSearchRoutes");
const curationRoutes = require("./routes/curationRoutes");
// 미들웨어
const authMiddleware = require("./middlewares/authMiddleware");

const app = express();

// CORS 미들웨어 (app.use(express.json()) 이전에 위치)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:5000"],
    // origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "OpenAI-Beta"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// 미들웨어
app.use(express.json());

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

// 패스포트 설정
app.use(passport.initialize());
app.use(passport.session());

// 라우터
// app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/history", historyRoutes);
// app.use("/api/search", searchRoutes);
// app.use("/api/naver/search", naverSearchRoutes);
app.use("/api/google/search", googleSearchRoutes);
app.use("/api/nominatim/search", nominatimSearchRoutes);
app.use("/api/curation", curationRoutes);

// 접속된 아이피와 포트 출력
app.get("/checkIpPort", function (req, res) {
  res.send(
    "접속된 아이피: " + req.ip + ", 접속된 포트: " + req.socket.localPort
  );
});

module.exports = app;
