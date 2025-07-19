const Concert = require('../models/concertModel');
const { fetchAndSaveConcerts } = require('../services/ticketmasterService');

exports.importConcerts = async (req, res) => {
    try {
      const { city = 'London', size = 20 } = req.query;
      const result = await fetchAndSaveConcerts(city, size);
      res.json({ 
        message: "Import process finished.",
        importedCount: result.insertedCount, 
        skippedCount: result.skippedCount,
        concerts: result.concerts 
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to import concerts', details: err.message });
    }
};

// New function to get all concerts
exports.getAllConcerts = async (req, res) => {
  try {
    const concerts = await Concert.find().populate('artist', 'name genre').sort({ date: 1 });
    res.json(concerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve concerts', details: err.message });
  }
};

// New function to get a single concert by ID
exports.getConcertById = async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id).populate('artist');
    if (!concert) {
      return res.status(404).json({ error: 'Concert not found' });
    }
    res.json(concert);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve concert', details: err.message });
  }
};

// Get concerts by city for the user workflow
exports.getConcertsByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const concerts = await Concert.find({ 
      city: { $regex: new RegExp(city, 'i') } 
    }).populate('artist', 'name genre').sort({ date: 1 });
    
    res.json(concerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve concerts by city', details: err.message });
  }
};