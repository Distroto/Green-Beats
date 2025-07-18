const Joi = require('joi');

exports.travelLogSchema = Joi.object({
  userId: Joi.string().optional(),
  artistId: Joi.string().optional(),
  concertId: Joi.string().required(),
  travelMode: Joi.string().valid('car', 'train', 'bus', 'flight', 'bike', 'walk').required(),
  distanceKm: Joi.number().positive().required(),
  emissionsKgCO2: Joi.number().positive().required(),
  notes: Joi.string().optional()
});
