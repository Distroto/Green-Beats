const Joi = require('joi');

exports.rewardSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  pointsRequired: Joi.number().min(0).required(),
  badgeIcon: Joi.string().optional()
});
