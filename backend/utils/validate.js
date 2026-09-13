const { isDateStringValid } = require('./date');

// 非空校验
const isNotEmpty = (value) => {
  return value !== undefined && value !== null && value !== '';
};

// 邮箱校验
const isEmail = (email) => {
  if (!isNotEmpty(email)) return false;
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return reg.test(String(email).trim());
};

// 用户名校验（1-10位）
const isUsernameValid = (username) => {
  if (!isNotEmpty(username)) return false;
  const name = String(username).trim();
  return name.length >= 1 && name.length <= 10;
};

// 密码校验（6-12位，至少要大小写字母+数字）
const isPasswordValid = (password) => {
  if (!isNotEmpty(password)) return false;
  const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,12}$/;
  return reg.test(password);
};

// 邮箱验证码校验（6位数字）
const isCodeValid = (code) => {
  if (!isNotEmpty(code)) return false;
  const reg = /^\d{6}$/;
  return reg.test(String(code).trim());
};

// 验证码场景校验
const isPurposeValid = (purpose) => {
  if (!isNotEmpty(purpose)) return false;
  const p = String(purpose).trim();
  return ['register', 'login', 'change_email'].includes(p);
};

// 年龄校验（0-120岁,有值时校验）
const isAgeValidIfPresent = (age) => {
  if (!isNotEmpty(age)) return true;
  const num = Number(age);
  if (isNaN(num) || !Number.isInteger(num)) return false;
  return num >= 0 && num <= 120;
};

// ID校验（正整数）
const isIdValid = (id) => {
  if (!isNotEmpty(id)) return false;
  const s = String(id).trim();
  if (!/^\d+$/.test(s)) return false;
  const num = Number(s);
  return Number.isInteger(num) && num > 0;
};

// 血型校验（有值时校验）
const isBloodTypeValidIfPresent = (bloodType) => {
  if (!isNotEmpty(bloodType)) return true;
  return ['A型', 'B型', 'AB型', 'O型'].includes(String(bloodType).trim());
};

// 标签数组校验
const isStringArrayValid = (arr, { maxItems = 20, maxLen = 50 } = {}) => {
  if (arr == null) return true;
  if (!Array.isArray(arr)) return false;
  if (arr.length > maxItems) return false;
  for (const item of arr) {
    if (typeof item !== 'string') return false;
    const s = item.trim();
    if (!s || s.length > maxLen) return false;
  }
  return true;
};

// 健康档案备注校验（有值时校验）
const isMedicalNotesValidIfPresent = (notes) => {
  if (!isNotEmpty(notes)) return true;
  return String(notes).trim().length <= 1000;
};

// 药品类型校验
const isMedicineTypeValid = (type) => {
  if (!isNotEmpty(type)) return false;
  return ['prescription', 'otc', 'healthcare'].includes(String(type).trim());
};

// 药品过期日期、打卡归属日期校验
const isDateValid = (date) => {
  return isDateStringValid(date);
};

// 可选字符串长度校验
const isOptionalStringMax = (value, maxLen) => {
  if (!isNotEmpty(value)) return true;
  return String(value).trim().length <= maxLen;
};

// 时间格式校验（HH:MM）
const isTimeValid = (time) => {
  if (!isNotEmpty(time)) return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(time).trim());
};

// 星期几校验（0-6）
const isDayValid = (day) => {
  const n = Number(day);
  return Number.isInteger(n) && n >= 0 && n <= 6;
};

// 星期几数组校验
const isDaysArrayValid = (days) => {
  if (!Array.isArray(days) || days.length === 0) return false;
  const set = new Set();
  for (const d of days) {
    if (!isDayValid(d)) return false;
    set.add(Number(d));
  }
  return set.size === days.length; // 确保没有重复的天
};

// 布尔值校验
const isBooleanValid = (value) => value === true || value === false;

// 提前提醒分钟数校验
const isReminderBeforeValid = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n)) return false;
  return [0, 5, 10, 15, 30].includes(n);
};

module.exports = {
  isNotEmpty,
  isEmail,
  isUsernameValid,
  isPasswordValid,
  isCodeValid,
  isPurposeValid,
  isAgeValidIfPresent,
  isIdValid,
  isBloodTypeValidIfPresent,
  isStringArrayValid,
  isMedicalNotesValidIfPresent,
  isMedicineTypeValid,
  isDateValid,
  isOptionalStringMax,
  isTimeValid,
  isDayValid,
  isDaysArrayValid,
  isBooleanValid,
  isReminderBeforeValid
};
