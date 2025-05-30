const axios = require("axios");

async function classifyCategory(text) {
  try {
    const response = await axios.post(
      `${process.env.ML_SERVER_URL}/classifyChat`,
      {
        text,
      }
    );
    return response.data.category;
  } catch (error) {
    console.error("❌ Flask 서버 분류 실패:", error.message);
    return "기타";
  }
}

module.exports = { classifyCategory };
