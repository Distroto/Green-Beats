const express = require('express');
const router = express.Router();
const concertController = require('../controllers/concertController');

router.post('/import', concertController.importConcerts);
router.get('/', concertController.getAllConcerts);
router.get('/city/:city', concertController.getConcertsByCity);
router.get('/:id', concertController.getConcertById);

module.exports = router;