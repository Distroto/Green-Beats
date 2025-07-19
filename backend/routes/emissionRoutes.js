const express = require('express');
const router = express.Router();
const { logEmission, getEmissionSuggestions, getUserTravelHistory } = require('../controllers/emissionController');
const validate = require('../middleware/validate');
const { logEmissionSchema } = require('../validators/emissionValidator');

router.post('/', validate(logEmissionSchema), logEmission);
router.get('/suggestions/:concertId', getEmissionSuggestions);
router.get('/history/:userId', getUserTravelHistory);

module.exports = router;
