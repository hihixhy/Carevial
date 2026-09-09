const dayjs = require('dayjs');

// 将日期格式化为YYYY-MM-DD
const toDateString = (value) => {
  if (value == null || value === '') return '';
  const d = dayjs(value);
  return d.isValid() ? d.format('YYYY-MM-DD') : '';
};

// 获取今天零点时间
const today = () => dayjs().startOf('day');

// 计算距离今天的天数差 正数=没过期 负数=已过期
const diffDaysFromToday = (expiryDate) => {
  return dayjs(expiryDate).startOf('day').diff(today(), 'day');
};

// 计算药品过期状态
const calcExpiryStatus = (expiryDate) => {
  const diff = diffDaysFromToday(expiryDate);
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'expiring';
  return 'normal';
};

// 判断YYYY-MM-DD格式是否有效
const isDateStringValid = (value) => {
  if (value == null || value === '') return false;
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = dayjs(s);
  return d.isValid() && d.format('YYYY-MM-DD') === s;
};

module.exports = {
  dayjs,
  toDateString,
  today,
  diffDaysFromToday,
  calcExpiryStatus,
  isDateStringValid
};
