const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.get('/captcha', authController.getCaptcha);
router.post('/send-code', authController.sendCode);
router.post('/register', authController.register);
router.post('/login', authController.loginByPassword);
router.post('/login-code', authController.loginByCode);
// 获取用户信息,需要登录
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
