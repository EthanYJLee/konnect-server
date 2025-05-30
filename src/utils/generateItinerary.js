const axios = require("axios");
const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function gptTranslateArray(textArray, targetLang) {
  const prompt =
    `Translate the following list of Korean phrases into ${targetLang}. Only return a JSON array of translated strings.\n\n` +
    JSON.stringify(textArray);

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful translation assistant. Only return a JSON array.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const raw = res.choices[0].message.content;
    const match = raw.match(/\[.*\]/s);
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ GPT 번역 실패:", err.message);
    return textArray; // fallback
  }
}

async function generateItinerary(
  startDate,
  endDate,
  departureCity,
  arrivalCity,
  spots,
  categories,
  language
) {
  try {
    const response = await axios.post(
      `${process.env.ML_SERVER_URL}/generateItinerary`,
      {
        startDate,
        endDate,
        departureCity,
        arrivalCity,
        spots,
        categories,
      }
    );
    console.log("================");
    console.log(response.data);
    console.log("================");

    const schedule = response.data.schedule;
    const textArray = [];
    const mappingIndex = [];

    for (const date in schedule) {
      for (const item of schedule[date]) {
        ["spot", "description", "city", "district", "neighborhood"].forEach(
          (field) => {
            if (item[field]) {
              textArray.push(item[field]);
              mappingIndex.push({
                date,
                index: schedule[date].indexOf(item),
                field,
              });
            }
          }
        );
      }
    }

    const translatedTexts = await gptTranslateArray(textArray, language);

    // 매핑
    mappingIndex.forEach((map, i) => {
      schedule[map.date][map.index][map.field] = translatedTexts[i];
    });

    return { schedule };
  } catch (error) {
    console.error("❌ Flask 서버 경로 생성 실패:", error.message);
    return { error: "경로 생성 실패" };
  }
}

module.exports = { generateItinerary };
