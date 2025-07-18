const mongoose = require('mongoose');

const ArtistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genre: String,
  profileImage: String,
  bio: String,
  homeCity: String,
  greenScore: { type: Number, default: 0 }, // out of 100
  ecoInitiatives: [String] // e.g. ["solar-powered stage", "plastic-free merch"]
}, { timestamps: true });

module.exports = mongoose.model('Artist', ArtistSchema);
