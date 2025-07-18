const Joi = require('joi');

exports.userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  preferredTransportMode: Joi.string().valid('car', 'train', 'bus', 'flight', 'bike', 'walk').default('car'),
  rewardPoints: Joi.number().min(0),
  badges: Joi.array().items(Joi.string())
});
