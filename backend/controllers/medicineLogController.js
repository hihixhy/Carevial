const MedicineLog = require('../models/MedicineLog');
const Reminder = require('../models/Reminder');
const validate = require('../utils/validate');

exports.getDayLogs = async (req, res) => {
  const date = req.query.date; // YYYY-MM-DD
  if (!validate.isDateValid(date)) {
    return res.status(400).json({
      code: 400,
      message: '日期格式错误，应为YYYY-MM-DD',
      data: null
    });
  }

  try {
    // 获取日期所属的星期几
    const weekday = new Date(`${date}T12:00:00`).getDay();

    const allReminders = await Reminder.findByUser(req.userId);
    // 获取当天提醒
    const schedule = allReminders
      .filter((r) => r.days === weekday)
      .sort((a, b) => a.time.localeCompare(b.time));

    // 获取当天打卡记录
    const logs = await MedicineLog.findByDate(req.userId, date);

    const logByReminderId = new Map();
    for (const log of logs) {
      if (log.reminderId != null) {
        logByReminderId.set(log.reminderId, log);
      }
    }

    // 合并提醒和打卡记录
    const items = schedule.map((r) => {
      const log = logByReminderId.get(r.id);
      return {
        reminderId: r.id,
        medicineId: r.medicineId,
        medicineName: r.medicineName,
        time: r.time,
        checked: Boolean(log), // 是否已打卡
        logId: log ? log.id : null // 打卡记录ID，用于删除
      };
    });

    const checkedCount = items.filter((item) => item.checked).length;

    return res.status(200).json({
      code: 200,
      message: '获取打卡列表成功',
      data: {
        date,
        items,
        checkedCount,
        total: items.length
      }
    });
  } catch (err) {
    console.error('获取打卡列表失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.addLog = async (req, res) => {
  const { reminderId, logDate } = req.body;
  if (!validate.isIdValid(reminderId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的提醒ID',
      data: null
    });
  }
  if (!validate.isDateValid(logDate)) {
    return res.status(400).json({
      code: 400,
      message: '日期格式错误，应为YYYY-MM-DD',
      data: null
    });
  }

  try {
    const reminder = await Reminder.findById(reminderId, req.userId);
    if (!reminder) {
      return res.status(404).json({
        code: 404,
        message: '提醒不存在或无权限访问',
        data: null
      });
    }

    // logDate的周几必须等于提醒的days
    const weekday = new Date(`${logDate}T12:00:00`).getDay();
    if (reminder.days !== weekday) {
      return res.status(400).json({
        code: 400,
        message: '该提醒不适用于所选日期',
        data: null
      });
    }

    // 判断是否已经打卡过
    const existing = await MedicineLog.findByReminderAndDate(
      Number(reminderId),
      req.userId,
      logDate
    );
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: '该提醒已打卡',
        data: null
      });
    }

    const id = await MedicineLog.create({
      reminder_id: Number(reminderId),
      medicine_id: reminder.medicineId,
      user_id: req.userId,
      scheduled_time: reminder.time,
      log_date: logDate
    });
    return res.status(200).json({
      code: 200,
      message: '打卡成功',
      data: {
        id
      }
    });
  } catch (err) {
    console.error('打卡失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.deleteLog = async (req, res) => {
  const { id } = req.params;
  if (!validate.isIdValid(id)) {
    return res.status(400).json({
      code: 400,
      message: '无效的打卡记录ID',
      data: null
    });
  }

  try {
    const deleted = await MedicineLog.delete(id, req.userId);
    if (!deleted) {
      return res.status(404).json({
        code: 404,
        message: '打卡记录不存在或无权限删除',
        data: null
      });
    }
    return res.status(200).json({
      code: 200,
      message: '取消打卡成功',
      data: null
    });
  } catch (err) {
    console.error('取消打卡失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};
