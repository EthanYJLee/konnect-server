const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String, // 일반 로그인 사용자만 저장
  googleId: String, // 구글 로그인 사용자만 저장
  social: {
    type: String,
    enum: ["Y", "N"],
    required: true,
    default: "N", // 기본값은 일반회원
  },
  // 20250526 추가
  gender: String,
  birthday: Date,
  picture: String,
  // -----------
  createdAt: {
    type: Date,
    default: null, // 최초 가입 시만 설정
  },
  lastLogin: {
    type: Date,
    default: null, // 로그인할 때마다 갱신
  },
});

module.exports = mongoose.model("User", UserSchema);
