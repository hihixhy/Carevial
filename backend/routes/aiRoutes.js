const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/chat-stream', aiController.chatStream);
router.post('/confirm', aiController.confirm);

module.exports = router;
