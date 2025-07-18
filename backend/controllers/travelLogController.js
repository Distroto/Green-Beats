const TravelLog = require('../models/travelLogModel');

exports.createLog = async (req, res) => {
  try {
    const log = await TravelLog.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllLogs = async (req, res) => {
  const logs = await TravelLog.find().populate('userId artistId concertId');
  res.json(logs);
};

exports.getLogById = async (req, res) => {
  const log = await TravelLog.findById(req.params.id).populate('userId artistId concertId');
  if (!log) return res.status(404).json({ error: 'Log not found' });
  res.json(log);
};

exports.updateLog = async (req, res) => {
  const updated = await TravelLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};
