import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')

// 获取今天零点时间
const today = () => dayjs().startOf('day')

// 计算距离今天的天数差 0和正数=没过期 负数=已过期
const diffDaysFromToday = (expiryDate) => {
  return dayjs(expiryDate).startOf('day').diff(today(), 'day')
}

// 判断YYYY-MM-DD格式是否有效
const isDateStringValid = (value) => {
  if (value == null || value === '') return false
  const s = String(value).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = dayjs(s)
  return d.isValid() && d.format('YYYY-MM-DD') === s
}

// 获取M月D日 星期x格式文字
const getDateLine = () => dayjs().format('M月D日 dddd')

// 获取今天日期字符串 YYYY-MM-DD
const getTodayDateStr = () => dayjs().format('YYYY-MM-DD')

// 获取星期几中文标签
const getWeekdayLabel = () => dayjs().format('dddd')

// 聊天气泡时间：今天只显示时分；跨天带上月日
const formatMessageTime = (value) => {
  const d = dayjs(value)
  if (!d.isValid()) return ''
  if (d.isSame(dayjs(), 'day')) return d.format('HH:mm')
  if (d.isSame(dayjs(), 'year')) return d.format('M月D日 HH:mm')
  return d.format('YYYY年M月D日 HH:mm')
}

export {
  dayjs,
  today,
  diffDaysFromToday,
  isDateStringValid,
  getDateLine,
  getTodayDateStr,
  getWeekdayLabel,
  formatMessageTime
}
