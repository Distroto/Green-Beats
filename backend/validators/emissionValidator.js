const Joi = require('joi');

exports.logEmissionSchema = Joi.object({
  userId: Joi.string().required(),
  concertId: Joi.string().required(),
  travelMode: Joi.string().valid('car', 'train', 'flight', 'bus', 'walk', 'bike').required(),
  originLat: Joi.number().required(),
  originLng: Joi.number().required()
});
