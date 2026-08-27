const crypto = require('crypto');
const svgCaptcha = require('svg-captcha');
const redis = require('../config/redis');

// 图形验证码有效期5分钟
const CAPTCHA_TTL = 300;

const getCaptchaKey = (id) => {
  return `captcha:${id}`;
};

// 创建图形验证码
const createCaptcha = async () => {
  // text: 验证码字符串
  // data: svg格式的验证码图片
  const { text, data } = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1ilI',
    noise: 3
  });

  // 生成一个唯一的ID
  const id = crypto.randomUUID();
  await redis.set(getCaptchaKey(id), text.toLowerCase(), 'EX', CAPTCHA_TTL);
  const image = 'data:image/svg+xml;base64,' + Buffer.from(data).toString('base64');
  return { captchaId: id, image };
};

// 校验图形验证码
const verifyCaptcha = async (id, input) => {
  if (!id || input == null || String(input).trim() === '') {
    return { ok: false };
  }

  const key = getCaptchaKey(id);
  const saved = await redis.get(key);
  await redis.del(key);
  if (!saved) {
    return { ok: false };
  }
  if (saved !== String(input).trim().toLowerCase()) {
    return { ok: false };
  }
  return { ok: true };
};

module.exports = {
  createCaptcha,
  verifyCaptcha
};
