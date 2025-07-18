const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const validate = require('../middleware/validate');
const { rewardSchema } = require('../validators/rewardValidator');

router.post('/', validate(rewardSchema), rewardController.createReward);
router.get('/', rewardController.getAllRewards);
router.get('/:id', rewardController.getRewardById);

module.exports = router;
