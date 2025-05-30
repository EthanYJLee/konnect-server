const express = require("express");
const passport = require("passport");
const router = express.Router();
const { profile } = require("../controllers/userController");
const { ensureAuth } = require("../middlewares/authMiddleware");

// 구글 로그인 시작
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 구글 로그인 콜백
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/api/users/profile");
  }
);

// 로그인된 사용자 정보
router.get("/profile", ensureAuth, profile);

module.exports = router;
