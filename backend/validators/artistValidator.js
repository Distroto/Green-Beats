const Joi = require('joi');

exports.artistSchema = Joi.object({
  name: Joi.string().required(),
  genre: Joi.string().optional(),
  profileImage: Joi.string().uri().optional(),
  bio: Joi.string().optional(),
  homeCity: Joi.string().optional(),
  greenScore: Joi.number().min(0).max(100).optional(),
  ecoInitiatives: Joi.array().items(Joi.string()).optional()
});
