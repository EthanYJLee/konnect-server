const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  const { query, lang = "en" } = req.query;
  console.log(lang);
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  try {
    // Nominatim 검색 API 사용
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          // q: query,
          amenity: query,
          country: "kr",
          format: "json",
          addressdetails: 1,
          limit: 10,
          accept_language: lang,
        },
        headers: {
          // 요청 제한 준수를 위한 User-Agent 필수
          "User-Agent": "Konnect-App/1.0",
        },
      }
    );

    // 결과를 Google Maps API 형식과 유사하게 변환
    const results = response.data.map((place) => ({
      name: place.display_name.split(",")[0],
      formatted_address: place.display_name,
      geometry: {
        location: {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
        },
      },
      place_id: place.place_id,
      types: [place.type],
      address_components: place.address,
    }));

    // 4. 결과 반환
    res.json({ results });
  } catch (error) {
    console.error(
      "Nominatim API error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch from Nominatim API" });
  }
});

module.exports = router;
