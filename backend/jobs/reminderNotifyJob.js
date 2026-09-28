const Reminder = require('../models/Reminder');
const reminderNotifyHub = require('../services/reminderNotifyHub');
const redis = require('../config/redis');
const { dayjs } = require('../utils/date');

const tick = async () => {
  try {
    // 获取在线用户id
    const onlineIds = reminderNotifyHub.getOnlineUserIds();
    if (onlineIds.length === 0) return;

    const dueList = await Reminder.findDueNow(onlineIds);
    const dateStr = dayjs().format('YYYY-MM-DD');
    // 计算到明天0点0分0秒剩余时间(秒)
    const ttlSeconds = dayjs().endOf('day').diff(dayjs(), 'second') + 1;

    for (const item of dueList) {
      // 用户不在线
      if (!reminderNotifyHub.hasClient(item.userId)) continue;

      const key = `notify:reminder:${item.reminderId}:${dateStr}:${item.notifyHm}`;
      // NX：key不存在才写入
      const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
      // key已经存在，今天已经发过提醒，直接跳过，不重复推送
      if (result !== 'OK') continue;

      // 发送通知
      reminderNotifyHub.send(item.userId, {
        type: 'reminder',
        reminderId: item.reminderId,
        medicineName: item.medicineName,
        time: item.time,
        notifyHm: item.notifyHm,
        soundEnabled: item.soundEnabled
      });
    }
  } catch (err) {
    console.error('reminderNotifyJob执行失败：', err);
  }
};

let timer = null;

const start = () => {
  if (timer) return;

  tick().catch((err) => console.error('reminderNotifyJob首次执行失败：', err));

  timer = setInterval(() => {
    tick().catch((err) => console.error('reminderNotifyJob执行失败：', err));
  }, 30 * 1000);

  console.log('reminderNotifyJob started');
};

const stop = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  start,
  stop
};
