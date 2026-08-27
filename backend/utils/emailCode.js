const redis = require('../config/redis');

// 验证码有效期5分钟
const CODE_TTL = 300;
// 同一邮箱同一场景：60 秒内不能重复发
const SEND_INTERVAL = 60;

// 拼接验证码缓存的 Redis Key
const getCodeKey = (purpose, email) => {
  return `email_code:${purpose}:${email}`;
};

// 拼接发送冷却锁的 Redis Key
const getSendLockKey = (purpose, email) => {
  return `email_code_send:${purpose}:${email}`;
};

// 生成6位随机验证码
const generateCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// 是否允许发送（防刷）
const canSend = async (purpose, email) => {
  const exists = await redis.exists(getSendLockKey(purpose, email));
  return exists === 0;
};

// 保存验证码+设置发送冷却
const saveCode = async (purpose, email, code) => {
  const codeKey = getCodeKey(purpose, email);
  const lockKey = getSendLockKey(purpose, email);

  // EX:代表单位是秒
  await redis.set(codeKey, code, 'EX', CODE_TTL);
  await redis.set(lockKey, '1', 'EX', SEND_INTERVAL);
};

// 校验验证码
const checkCode = async (purpose, email, code) => {
  const codeKey = getCodeKey(purpose, email);
  const saved = await redis.get(codeKey);

  if (!saved) {
    return { ok: false, message: '验证码无效或已过期' };
  }
  if (saved !== String(code).trim()) {
    return { ok: false, message: '验证码错误' };
  }

  return { ok: true, message: '验证成功' };
};

// 核销验证码
const consumeCode = async (purpose, email) => {
  const codeKey = getCodeKey(purpose, email);
  await redis.del(codeKey);
};

// 校验验证码，成功就删除（登录用）
const verifyCode = async (purpose, email, code) => {
  const result = await checkCode(purpose, email, code);
  if (!result.ok) return result;
  await consumeCode(purpose, email);
  return result;
};

module.exports = {
  generateCode,
  canSend,
  saveCode,
  checkCode,
  consumeCode,
  verifyCode
};
