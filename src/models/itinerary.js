const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const ItinerarySchema = new mongoose.Schema({
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  itinerary: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  useYn: {
    type: Boolean,
    default: true,
  },
  
});

module.exports = mongoose.model("Itinerary", ItinerarySchema);
