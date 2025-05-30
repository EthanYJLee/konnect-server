const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

router.get("/", async (req, res) => {
  const { query, lang = "en" } = req.query;
  console.log(lang);
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      {
        params: {
          query,
          key: GOOGLE_API_KEY,
          language: lang,
        },
      }
    );
    // console.log(response);
    console.log(response.data.results);

    res.json({ results: response.data.results });
  } catch (error) {
    console.error(
      "Google Maps API error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch from Google Maps API" });
  }
});

module.exports = router;
