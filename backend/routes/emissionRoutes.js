const express = require('express');
const router = express.Router();
const emissionController = require('../controllers/emissionController');

router.post('/', emissionController.logEmission);
router.get('/users/:id/emissions', emissionController.getUserEmissions);
router.get('/suggestions/:concertId', emissionController.getSuggestions);

module.exports = router;
