const Reward = require('../models/rewardModel');

exports.createReward = async (req, res) => {
  try {
    const reward = await Reward.create(req.body);
    res.status(201).json(reward);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllRewards = async (req, res) => {
  const rewards = await Reward.find();
  res.json(rewards);
};

exports.getRewardById = async (req, res) => {
  const reward = await Reward.findById(req.params.id);
  if (!reward) return res.status(404).json({ error: 'Reward not found' });
  res.json(reward);
};