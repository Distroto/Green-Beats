const Concert = require('../models/concertModel');

exports.createConcert = async (req, res) => {
  try {
    const concert = await Concert.create(req.body);
    res.status(201).json(concert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllConcerts = async (req, res) => {
  const concerts = await Concert.find().populate('artist');
  res.json(concerts);
};

exports.getConcertById = async (req, res) => {
  const concert = await Concert.findById(req.params.id).populate('artist');
  if (!concert) return res.status(404).json({ error: 'Concert not found' });
  res.json(concert);
};

