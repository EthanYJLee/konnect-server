const express = require("express");
const axios = require("axios");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { generateItinerary } = require("../utils/generateItinerary");
const mongoose = require("mongoose");
const Itinerary = require("../models/itinerary");
require("dotenv").config();

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

router.post("/saveItinerary", authenticateToken, async (req, res) => {
  const { data } = req.body;
  console.log(data);

  const itinerary = new Itinerary({
    userId: req.userId,
    itinerary: data,
    createdAt: new Date(),
    useYn: true,
  });

  await itinerary.save();

  res.json({ itinerary });
});

router.post("/generate", async (req, res) => {
  const {
    startDate,
    endDate,
    departureCity,
    arrivalCity,
    spots,
    categories,
    language,
  } = req.body;
  // console.log(spots);
  // console.log(startDate);
  // console.log(endDate);
  // console.log(departureCity);
  // console.log(arrivalCity);
  // console.log(categories);
  // console.log(language);
  const itinerary = await generateItinerary(
    startDate,
    endDate,
    departureCity,
    arrivalCity,
    spots,
    categories,
    language
  );
  console.log(itinerary);
  res.json({ itinerary });
});

module.exports = router;
