const express = require('express');
const router = express.Router();
const travelLogController = require('../controllers/travelLogController');
const validate = require('../middleware/validate');
const { travelLogSchema } = require('../validators/travelLogValidator');

router.post('/', validate(travelLogSchema), travelLogController.createLog);
router.get('/', travelLogController.getAllLogs);
router.get('/:id', travelLogController.getLogById);
router.put('/:id', validate(travelLogSchema), travelLogController.updateLog);

module.exports = router;
