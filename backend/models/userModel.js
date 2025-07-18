const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  preferredTransportMode: { type: String, enum: ['car', 'train', 'bus', 'flight', 'bike', 'walk'], default: 'car' },
  rewardPoints: { type: Number, default: 0 },
  badges: [String]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
