const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');
const validate = require('../middleware/validate');
const { artistSchema } = require('../validators/artistValidator');

router.post('/', validate(artistSchema), artistController.createArtist);
router.get('/', artistController.getAllArtists);
router.get('/:id', artistController.getArtistById);

module.exports = router;
