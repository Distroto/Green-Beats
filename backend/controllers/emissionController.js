const Concert = require('../models/concertModel');
const TravelLog = require('../models/travelLogModel');
const User = require('../models/userModel');
const { haversineDistance, getEmissionFactor } = require('../services/emissionCalculator');
const { assignRewardsToUser } = require('../services/rewardEngine');

exports.logEmission = async (req, res) => {
  try {
    const { userId, concertId, travelMode, originLat, originLng } = req.body;

    const concert = await Concert.findById(concertId);
    if (!concert || !concert.geoCoordinates) {
      return res.status(404).json({ error: 'Concert not found or missing coordinates' });
    }

    const destination = concert.geoCoordinates;
    const distance = haversineDistance(originLat, originLng, destination.lat, destination.lng);
    const factor = getEmissionFactor(travelMode);

    if (factor === undefined) {
      return res.status(400).json({ error: 'Unsupported travel mode' });
    }

    const emissions = +(distance * factor).toFixed(2);

    // Create travel log
    await TravelLog.create({
      userId,
      concertId,
      travelMode,
      distanceKm: distance,
      emissionsKgCO2: emissions
    });

    // Update user reward points
    const user = await User.findById(userId);
    user.rewardPoints += Math.round(emissions); // You can use custom logic
    await user.save();

    const newBadges = await assignRewardsToUser(userId);

    res.status(201).json({
      distanceKm: distance,
      emissionsKgCO2: emissions,
      rewardPoints: user.rewardPoints,
      newBadges,
      alternativeOptions: Object.entries(getEmissionFactor.all()).map(([mode, factor]) => ({
        mode,
        estimatedEmissions: +(distance * factor).toFixed(2)
      }))
    });

  } catch (err) {
    res.status(500).json({ error: 'Emission logging failed', details: err.message });
  }
};

// Get emission suggestions for a concert
exports.getEmissionSuggestions = async (req, res) => {
  try {
    const { concertId } = req.params;
    const { originLat, originLng } = req.query;

    if (!originLat || !originLng) {
      return res.status(400).json({ error: 'Origin coordinates required' });
    }

    const concert = await Concert.findById(concertId);
    if (!concert || !concert.geoCoordinates) {
      return res.status(404).json({ error: 'Concert not found or missing coordinates' });
    }

    const distance = haversineDistance(originLat, originLng, concert.geoCoordinates.lat, concert.geoCoordinates.lng);
    const emissionFactors = getEmissionFactor.all();

    const suggestions = Object.entries(emissionFactors).map(([mode, factor]) => ({
      mode,
      distanceKm: distance,
      estimatedEmissions: +(distance * factor).toFixed(2),
      isRecommended: ['walk', 'bike', 'train'].includes(mode)
    }));

    // Sort by emissions (lowest first)
    suggestions.sort((a, b) => a.estimatedEmissions - b.estimatedEmissions);

    res.json({
      concert: {
        name: concert.name,
        location: concert.location,
        date: concert.date
      },
      origin: { lat: originLat, lng: originLng },
      suggestions
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to get emission suggestions', details: err.message });
  }
};

// Get user's travel history
exports.getUserTravelHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const travelLogs = await TravelLog.find({ userId })
      .populate({
        path: 'concertId',
        select: 'name date location artist',
        populate: {
          path: 'artist',
          select: 'name'
        }
      })
      .sort({ timestamp: -1 });

    const totalEmissions = travelLogs.reduce((sum, log) => sum + log.emissionsKgCO2, 0);
    const totalDistance = travelLogs.reduce((sum, log) => sum + log.distanceKm, 0);

    res.json({
      travelLogs,
      summary: {
        totalTrips: travelLogs.length,
        totalEmissionsKgCO2: +totalEmissions.toFixed(2),
        totalDistanceKm: +totalDistance.toFixed(2),
        averageEmissionsPerTrip: travelLogs.length > 0 ? +(totalEmissions / travelLogs.length).toFixed(2) : 0
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to get travel history', details: err.message });
  }
};
