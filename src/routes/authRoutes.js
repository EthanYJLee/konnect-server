const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/user");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 이메일 중복 확인
router.get("/checkEmailExists", async (req, res) => {
  const { email } = req.query;
  console.log(email);
  const existingUser = await User.findOne({ email });
  console.log(existingUser);
  res.json({ exists: !!existingUser });
});

// 일반 회원가입
router.post("/register", async (req, res) => {
  const { username, email, password, picture } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);
  const now = new Date();
  const user = new User({
    username,
    email,
    password: hashed,
    social: "N",
    picture,
    createdAt: now,
    lastLogin: now,
  });
  await user.save();
  res.status(201).json({ message: "User created" });
});

// 일반 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.social === "Y")
    return res.status(400).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token, email });
});

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.redirect(`http://localhost:3000/oauth-success?token=${token}`); // 프론트로 리다이렉트
  }
);

// 프론트에서 credential 받은 후 처리
router.post("/google/token", async (req, res) => {
  console.log("Received full request body:", JSON.stringify(req.body));
  const { credential, type, email, name, picture, id } = req.body;
  console.log("Extracted credentials:", {
    credential: typeof credential,
    type,
    hasEmail: !!email,
    hasName: !!name,
    hasId: !!id,
  });

  try {
    let googleId, userEmail, userName, userPicture;

    // 토큰 타입에 따른 처리
    if (type === "access_token") {
      // 액세스 토큰인 경우 클라이언트에서 받은 사용자 정보 사용
      googleId = id;
      userEmail = email;
      userName = name;
      userPicture = picture;
      console.log("Using access token with user info from client", {
        googleId,
        userEmail,
        userName,
      });
    } else {
      // ID 토큰인 경우 기존 로직 사용
      if (typeof credential === "object") {
        console.error(
          "Credential is an object, but expected string for ID token"
        );
        return res.status(400).json({ message: "Invalid credential format" });
      }

      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        googleId = payload.sub;
        userEmail = payload.email;
        userName = payload.name;
        console.log("Verified ID token payload:", payload);
      } catch (verifyError) {
        console.error("Error verifying ID token:", verifyError);
        return res.status(401).json({ message: "Invalid Google token" });
      }
    }

    // 사용자 정보가 없으면 오류
    if (!googleId || !userEmail) {
      console.error("Missing required user information");
      return res.status(400).json({ message: "Missing user information" });
    }

    // 사용자 조회 또는 생성
    let user = await User.findOne({ googleId });
    const now = new Date();

    if (!user) {
      // 최초 가입: createdAt, lastLogin 모두 저장
      user = await User.create({
        googleId,
        email: userEmail,
        username: userName,
        picture: userPicture,
        social: "Y",
        createdAt: now,
        lastLogin: now,
      });
    } else {
      // 기존 유저: lastLogin만 업데이트
      user.lastLogin = now;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("Login successful for:", userEmail);
    res.json({ token, email: userEmail });
  } catch (err) {
    console.error("Google token verify failed:", err);
    res.status(401).json({ message: "Invalid Google token" });
  }
});

// 토큰 갱신 API
router.post("/refresh", async (req, res) => {
  const { token } = req.body;
  console.log(
    "Token refresh requested:",
    token ? "Token provided" : "No token"
  );

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    // 기존 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified successfully, userId:", decoded.id);

    // 사용자 ID 추출
    const userId = decoded.id;

    // 사용자 조회
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // 새 토큰 발급 (1시간 유효)
    const newToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("New token issued for user:", user.email);
    res.json({ token: newToken, email: user.email });
  } catch (err) {
    console.error("Token refresh failed:", err);

    // 토큰이 만료된 경우에도 사용자 정보를 복구하려고 시도
    if (err.name === "TokenExpiredError") {
      try {
        // 만료된 토큰에서도 페이로드 추출 가능 (검증 없이)
        const payload = jwt.decode(token);
        if (payload && payload.id) {
          console.log("Token expired, attempting to recover user from payload");

          // 사용자 조회
          const user = await User.findById(payload.id);
          if (user) {
            // 새 토큰 발급
            const newToken = jwt.sign(
              { id: user._id },
              process.env.JWT_SECRET,
              {
                expiresIn: "1h",
              }
            );

            console.log(
              "Recovered user session after token expiry for:",
              user.email
            );
            return res.json({ token: newToken, email: user.email });
          }
        }
      } catch (decodeErr) {
        console.error("Failed to recover from expired token:", decodeErr);
      }

      return res.status(401).json({ message: "Token expired" });
    }

    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
