// AI 대화 관련
const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Thread = require("../models/thread");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// JWT 인증 미들웨어
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.id;
    next();
  });
}

// 대화 기록 조회
router.get("/thread/:threadId", authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const response = await openai.beta.threads.messages.list(threadId);
  const messages = [];

  response.data.forEach((message) => {
    // console.log(`[${message.role}]`, message.content[0].text.value);
    messages.push({
      type: message.role === "user" ? "user" : "ai",
      content: message.content[0].text.value,
      timestamp: new Date(message.created_at * 1000).toISOString(),
    });
  });
  console.log(messages);
  res.json({ messages });
});

// 대화 기록 목록 조회
router.get("/threadList", authenticateToken, async (req, res) => {
  const user = await User.findById(req.userId);
  const threadList = await Thread.find({ userId: user._id });
  res.json({ list: threadList });
});

// 대화 보내기
router.post("/ask", authenticateToken, async (req, res) => {
  const { messages, threadId } = req.body;

  const userMessages = messages?.filter((msg) => msg.type === "user").slice(-1);

  if (!userMessages || userMessages.length === 0) {
    return res.status(400).json({ error: "전달할 사용자 메시지가 없습니다." });
  }

  const userMessageContent = userMessages[0].content;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User Not Found" });

    let thread_id = threadId;
    let thread;

    if (!thread_id) {
      // 1. Thread가 없으면 OpenAI에 새 thread 생성
      const openaiThread = await openai.beta.threads.create();
      thread_id = openaiThread.id;

      // 2. DB에 저장
      thread = await Thread.create({
        userId: user._id,
        threadId: thread_id,
        // title: "",
        title: userMessageContent,
      });
    } else {
      // 3. 기존 thread 정보 확인 (DB + OpenAI)
      thread = await Thread.findOne({ threadId: thread_id });
      if (!thread) {
        // 예외 처리: DB에 없으면 생성
        thread = await Thread.create({
          userId: user._id,
          threadId: thread_id,
          title: "",
        });
      }

      // OpenAI 쪽에서도 유효한 thread인지 확인
      await openai.beta.threads.retrieve(thread_id);
    }

    // 4. 사용자 메시지 추가
    await openai.beta.threads.messages.create(thread_id, {
      role: "user",
      content: userMessageContent,
    });

    // 5. Run 실행
    const run = await openai.beta.threads.runs.create(thread_id, {
      assistant_id: ASSISTANT_ID,
    });

    // 6. Run 완료 대기
    let runStatus;
    do {
      runStatus = await openai.beta.threads.runs.retrieve(thread_id, run.id);
      if (runStatus.status === "completed") break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (
      ["queued", "in_progress", "cancelling"].includes(runStatus.status)
    );

    if (runStatus.status !== "completed") {
      return res.status(500).json({ error: "Run failed or cancelled" });
    }

    // 7. Assistant 응답 추출
    const threadMessages = await openai.beta.threads.messages.list(thread_id);
    const assistantMessage = threadMessages.data.find(
      (msg) => msg.role === "assistant"
    );

    res.json({
      reply: assistantMessage?.content?.[0]?.text?.value || "(응답 없음)",
      threadId: thread_id,
    });
  } catch (err) {
    console.error("Assistant API error:", err);
    res.status(500).json({ error: "Assistant API 처리 실패" });
  }
});

// 대화 기록 삭제
router.delete("/thread/:threadId", authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const user = await User.findById(req.userId);

    const thread = await Thread.findOne({
      threadId: threadId,
      userId: user._id,
    });

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    await openai.beta.threads.del(threadId);

    await Thread.deleteOne({ threadId: threadId });

    res.json({ message: "Thread deleted successfully" });
  } catch (err) {
    console.error("Thread deletion error:", err);
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

module.exports = router;
