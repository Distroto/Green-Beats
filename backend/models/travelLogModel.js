const mongoose = require('mongoose');

const travelLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
  concertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Concert', required: true },
  travelMode: { type: String, enum: ['car', 'train', 'flight', 'bus', 'walk', 'bike'], required: true },
  distanceKm: { type: Number, required: true },
  emissionsKgCO2: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TravelLog', travelLogSchema);
