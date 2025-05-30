const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const PairMessageSchema = new mongoose.Schema({
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  threadId: {
    type: String,
    ref: "Thread",
    required: true,
  },
  pairOrder: Number,
  userMessage: {
    content: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  aiMessage: {
    content: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  category: String,
});
module.exports = mongoose.model("PairMessage", PairMessageSchema);
