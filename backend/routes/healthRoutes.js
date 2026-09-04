const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', healthController.getProfiles);
router.put('/:memberId', healthController.updateProfile);

module.exports = router;
