const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  pointsRequired: { type: Number, required: true },
  badgeIcon: String
});

module.exports = mongoose.model('Reward', RewardSchema);
