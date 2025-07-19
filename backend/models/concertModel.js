const mongoose = require('mongoose');

const ConcertSchema = new mongoose.Schema({
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },  // e.g., "Madison Square Garden"
  venue: { type: String },
  city: { type: String, required: true },
  country: { type: String, required: true },
  externalId: { type: String, unique: true, index: true },
  geoCoordinates: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Concert', ConcertSchema);
