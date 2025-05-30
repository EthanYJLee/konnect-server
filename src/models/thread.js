const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const ThreadSchema = new mongoose.Schema({
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  threadId: {
    type: String,
    required: true,
    unique: true,
  },
  title: String, // 예: "생활정보 상담", "비자 문의"
  createdAt: Date,
  updatedAt: Date,
});
module.exports = mongoose.model("Thread", ThreadSchema);
