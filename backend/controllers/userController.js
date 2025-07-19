const User = require('../models/userModel');
const TravelLog = require('../models/travelLogModel');

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    // Handle duplicate email error
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users', details: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user', details: err.message });
  }
};

// New function for a complete user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean(); // .lean() for a plain JS object

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const travelLogs = await TravelLog.find({ userId: id })
      .populate({
        path: 'concertId',
        select: 'name date artist',
        populate: {
          path: 'artist',
          select: 'name'
        }
      })
      .sort({ timestamp: -1 });
      
    const totalEmissions = travelLogs.reduce((sum, log) => sum + log.emissionsKgCO2, 0);

    res.json({
      ...user,
      totalEmissionsKgCO2: +totalEmissions.toFixed(2),
      travelLogs
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user profile', details: err.message });
  }
};