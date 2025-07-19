const Artist = require('../models/artistModel');

exports.createArtist = async (req, res) => {
  try {
    const artist = await Artist.create(req.body);
    res.status(201).json(artist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllArtists = async (req, res) => {
  const artists = await Artist.find();
  res.json(artists);
};

exports.getArtistById = async (req, res) => {
  const artist = await Artist.findById(req.params.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  res.json(artist);
};
