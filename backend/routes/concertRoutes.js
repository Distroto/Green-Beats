const express = require('express');
const router = express.Router();
const concertController = require('../controllers/concertController');
const validate = require('../middleware/validate');
const { concertSchema } = require('../validators/concertValidator');

router.post('/', validate(concertSchema), concertController.createConcert);
router.get('/', concertController.getAllConcerts);
router.get('/:id', concertController.getConcertById);

module.exports = router;
