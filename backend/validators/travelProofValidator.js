const Joi = require('joi');

exports.uploadTravelProofSchema = Joi.object({
  userId: Joi.string().required(),
  concertId: Joi.string().required(),
  travelMode: Joi.string().valid('car', 'train', 'flight', 'bus', 'walk', 'bike').required(),
  originLat: Joi.number().required(),
  originLng: Joi.number().required(),
  proofDescription: Joi.string().min(10).max(500).required()
});

exports.verifyTravelProofSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  notes: Joi.string().when('status', {
    is: 'rejected',
    then: Joi.string().min(10).required(),
    otherwise: Joi.string().optional()
  }),
  adminId: Joi.string().required()
}); 