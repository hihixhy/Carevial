const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { sendCodeLimiter, authLimiter } = require('../middleware/rateLimit');
const { uploadSingle } = require('../utils/upload');

router.get('/captcha', authController.getCaptcha);
router.post('/send-code', sendCodeLimiter, authController.sendCode);
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.loginByPassword);
router.post('/login-code', authLimiter, authController.loginByCode);
// 获取用户信息,需要登录
router.get('/me', authMiddleware, authController.getMe);

router.patch('/profile', authMiddleware, authController.updateProfile);
router.patch('/settings', authMiddleware, authController.updateSettings);
router.patch('/password', authMiddleware, authController.changePassword);
router.post('/change-email', authMiddleware, authController.changeEmail);
router.post('/avatar', authMiddleware, uploadSingle, authController.uploadAvatar);

router.post('/logout', authController.logout);

module.exports = router;
