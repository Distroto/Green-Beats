const Joi = require('joi');

exports.concertSchema = Joi.object({
  artist: Joi.string().required(), // artistId
  name: Joi.string().required(),
  date: Joi.date().required(),
  location: Joi.string().required(),
  venue: Joi.string().optional(),
  city: Joi.string().required(),
  country: Joi.string().required(),
  geoCoordinates: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).required()
});
