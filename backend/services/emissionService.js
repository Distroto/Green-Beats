const EmissionFactor = require('../models/EmissionFactor');

const calculateEmissions = async (transportMode, distanceKm) => {
  const factor = await EmissionFactor.findOne({ mode: transportMode });
  if (!factor) throw new Error('Unknown transport mode');
  return distanceKm * factor.kgCO2PerKm;
};

module.exports = { calculateEmissions };
