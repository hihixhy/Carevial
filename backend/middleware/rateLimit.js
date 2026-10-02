const rateLimit = require('express-rate-limit');

// 发送验证码频率限制，15分钟内最多8次
const sendCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: '发送验证码过于频繁，请稍后再试'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: '登录/注册过于频繁，请稍后再试'
  }
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'AI 请求过于频繁，请稍后再试'
  }
});

module.exports = {
  sendCodeLimiter,
  authLimiter,
  aiLimiter
};
