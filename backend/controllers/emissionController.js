const TravelLog = require('../models/travelLogModel');
const Concert = require('../models/concertModel');
const emissionFactors = require('../mock/emissionFactors.json');

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// POST /emissions
exports.logEmission = async (req, res) => {
  const { userId, concertId, travelMode, originLat, originLng } = req.body;

  if (!concert.geoCoordinates || !concert.geoCoordinates.lat || !concert.geoCoordinates.lng) {
    return res.status(400).json({ error: 'Concert is missing geoCoordinates' });
  }
  

  try {
    const concert = await Concert.findById(concertId);
    if (!concert) return res.status(404).json({ error: 'Concert not found' });

    const { lat, lng } = concert.geoCoordinates;
    const distanceKm = haversine(originLat, originLng, lat, lng);

    const factor = emissionFactors.find(f => f.mode === travelMode);
    if (!factor) return res.status(400).json({ error: 'Invalid travel mode' });

    const emissions = distanceKm * factor.kgCO2PerKm;

    const log = await TravelLog.create({
      userId,
      concertId,
      travelMode,
      distanceKm,
      emissionsKgCO2: emissions
    });

    // Compare with all other modes
    const comparisons = emissionFactors.map(f => ({
      mode: f.mode,
      emissions: f.kgCO2PerKm * distanceKm
    }));

    res.status(201).json({ emissions, distanceKm, comparisons, log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /users/:id/emissions
exports.getUserEmissions = async (req, res) => {
  try {
    const logs = await TravelLog.find({ userId: req.params.id }).populate('concertId');
    const totalEmissions = logs.reduce((sum, l) => sum + l.emissionsKgCO2, 0);
    res.status(200).json({ totalEmissions, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /suggestions/:concertId
exports.getSuggestions = async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.concertId);
    if (!concert) return res.status(404).json({ error: 'Concert not found' });

    const originLat = 40.7128; // NYC default
    const originLng = -74.0060;

    const { lat, lng } = concert.geoCoordinates;
    const distanceKm = haversine(originLat, originLng, lat, lng);

    const suggestions = emissionFactors.map(f => ({
      mode: f.mode,
      emissions: f.kgCO2PerKm * distanceKm
    }));

    res.status(200).json({ distanceKm, suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
