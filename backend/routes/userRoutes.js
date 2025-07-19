const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { userSchema } = require('../validators/userValidators');

router.post('/', validate(userSchema), userController.createUser);
router.get('/', userController.getAllUsers);

// More specific route first
router.get('/:id/profile', userController.getUserProfile);

// Generic route last
router.get('/:id', userController.getUserById);

module.exports = router;