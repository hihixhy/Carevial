const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const aiConversationController = require('../controllers/aiConversationController');
const authMiddleware = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

router.use(authMiddleware);

router.get('/conversations', aiConversationController.getConversations);
router.post('/conversations', aiConversationController.createConversation);
router.get('/conversations/:publicId', aiConversationController.getConversation);
router.patch('/conversations/:publicId', aiConversationController.renameConversation);
router.delete('/conversations/:publicId', aiConversationController.deleteConversation);
router.post('/conversations/:publicId/messages', aiConversationController.appendMessage);
router.patch(
  '/conversations/:publicId/messages/:messageId',
  aiConversationController.updateMessageActionStatus
);
// 生成标题
router.patch('/conversations/:publicId/generate-title', aiConversationController.generateTitle);

router.post('/chat-stream', aiLimiter, aiController.chatStream);
router.post('/confirm', aiLimiter, aiController.confirm);

module.exports = router;
