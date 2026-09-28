const Medicine = require('../../models/Medicine');
const MedicineLog = require('../../models/MedicineLog');
const Reminder = require('../../models/Reminder');
const validate = require('../../utils/validate');

const listDayCheckins = {
  name: 'list_day_checkins',
  kind: 'read',
  definition: {
    type: 'function',
    function: {
      name: 'list_day_checkins',
      description:
        '查询某日应服提醒及打卡状态。用户问「今天吃了没」「某天打卡情况」时调用；打卡/取消前先调本工具拿 reminderId / logId。',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: '查询日期，格式为YYYY-MM-DD' }
        },
        required: ['date']
      }
    }
  },
  run: async (userId, args) => {
    const date = args?.date;
    if (!validate.isDateValid(date)) {
      return {
        ok: false,
        message: '日期格式错误，应为YYYY-MM-DD'
      };
    }

    // 获取日期所属的星期几
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const allReminders = await Reminder.findByUser(userId);
    // 获取当天提醒
    const schedule = allReminders
      .filter((r) => r.days === weekday)
      .sort((a, b) => a.time.localeCompare(b.time));

    // 获取当天打卡记录
    const logs = await MedicineLog.findByDate(userId, date);

    // 按 reminderId 建 Map
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
        logId: log ? log.id : null // 打卡记录ID，未打卡为null
      };
    });

    const checkedCount = items.filter((item) => item.checked).length;

    return {
      date,
      items,
      checkedCount,
      total: items.length
    };
  }
};

const addCheckin = {
  name: 'add_checkin',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'add_checkin',
      description:
        '为某条提醒在指定日期打卡。须先 list_day_checkins 拿真实 reminderId。logDate 为服药归属日（补打请用对应日期，勿与当前时刻混淆）。直接调用本工具，由系统确认卡执行；不要口头二次确认，不要声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          reminderId: { type: 'integer', description: '提醒ID' },
          logDate: {
            type: 'string',
            description:
              '服药归属日期，格式为YYYY-MM-DD。表示「算哪一天吃过」，不是点击确认的时刻。平时用今天；用户说补打昨天/某天时，用那一天的日期。「今天」用系统时间中的日期。'
          }
        },
        required: ['reminderId', 'logDate']
      }
    }
  },
  failHint: '请先 list_day_checkins 核对 reminderId 与日期，再重新调用 add_checkin',
  buildPending: async (userId, args) => {
    const reminderId = args?.reminderId;
    const logDate = args?.logDate;

    if (!validate.isIdValid(reminderId)) {
      return { ok: false, message: 'reminderId无效' };
    }
    if (!validate.isDateValid(logDate)) {
      return { ok: false, message: '日期格式错误，应为YYYY-MM-DD' };
    }

    const reminder = await Reminder.findById(reminderId, userId);
    if (!reminder) {
      return { ok: false, message: '该提醒不存在或无权限访问' };
    }

    // logDate的周几必须等于提醒的days
    const weekday = new Date(`${logDate}T12:00:00`).getDay();
    if (reminder.days !== weekday) {
      return { ok: false, message: '该提醒不适用于所选日期' };
    }

    // 判断是否已经打卡过
    const existing = await MedicineLog.findByReminderAndDate(Number(reminderId), userId, logDate);
    if (existing) {
      return { ok: false, message: '该提醒已打卡' };
    }

    return {
      ok: true,
      pendingAction: {
        type: 'add_checkin',
        summary: `打卡：${reminder.medicineName} ${reminder.time}（${logDate}）`,
        fields: [
          { label: '药品', value: reminder.medicineName },
          { label: '时间', value: reminder.time },
          { label: '打卡日期', value: logDate }
        ],
        payload: {
          reminderId: Number(reminderId),
          logDate: String(logDate).trim()
        },
        resultText: {
          done: '已打卡，可在「用药打卡」页面查看',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const { reminderId, logDate } = payload || {};

    const reminder = await Reminder.findById(reminderId, userId);
    if (!reminder) {
      return { ok: false, message: '该提醒不存在或无权限访问' };
    }

    const weekday = new Date(`${logDate}T12:00:00`).getDay();
    if (reminder.days !== weekday) {
      return { ok: false, message: '该提醒不适用于所选日期' };
    }

    // 判断是否已经打卡过
    const existing = await MedicineLog.findByReminderAndDate(Number(reminderId), userId, logDate);
    if (existing) {
      return { ok: false, message: '该提醒已打卡' };
    }

    const id = await MedicineLog.create({
      reminder_id: Number(reminderId),
      medicine_id: reminder.medicineId,
      user_id: userId,
      scheduled_time: reminder.time,
      log_date: logDate
    });
    return {
      ok: true,
      message: '已打卡',
      data: { id }
    };
  }
};

const cancelCheckin = {
  name: 'cancel_checkin',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'cancel_checkin',
      description:
        '取消某次打卡。须先 list_day_checkins 拿到真实 logId，以及当天的日期（作为 logDate 传入，与 list 的 date 相同）。直接调用本工具，由系统确认卡执行；不要口头二次确认，不要声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          logId: { type: 'integer', description: '打卡记录ID（须为真实ID）' },
          logDate: {
            type: 'string',
            description: '服药归属日 YYYY-MM-DD（与 list_day_checkins 的 date 相同，用于定位记录）'
          }
        },
        required: ['logId', 'logDate']
      }
    }
  },
  failHint: '请先 list_day_checkins 核对 logId 与日期，再重新调用 cancel_checkin',
  buildPending: async (userId, args) => {
    const logId = args?.logId;
    const logDate = args?.logDate;
    if (!validate.isIdValid(logId)) {
      return { ok: false, message: 'logId无效' };
    }
    if (!validate.isDateValid(logDate)) {
      return { ok: false, message: 'logDate日期格式错误，应为YYYY-MM-DD' };
    }

    const logs = await MedicineLog.findByDate(userId, logDate);
    const log = logs.find((l) => Number(l.id) === Number(logId));
    if (!log) {
      return { ok: false, message: '打卡记录不存在或不属于该日期' };
    }

    const medicine = await Medicine.findById(log.medicineId, userId);
    // 即使药品删了，也要返回药品名
    const medicineName = medicine ? medicine.name : '未知药品';

    return {
      ok: true,
      pendingAction: {
        type: 'cancel_checkin',
        summary: `取消打卡：${medicineName} ${log.scheduledTime}（${log.logDate}）`,
        fields: [
          { label: '药品', value: medicineName },
          { label: '提醒时间', value: log.scheduledTime },
          { label: '打卡日期', value: log.logDate }
        ],
        payload: {
          logId: Number(logId),
          logDate: String(logDate).trim()
        },
        resultText: {
          done: '已取消打卡',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const { logId } = payload || {};
    if (!validate.isIdValid(logId)) {
      return { ok: false, message: 'logId无效' };
    }

    const deleted = await MedicineLog.delete(logId, userId);
    if (!deleted) {
      return { ok: false, message: '打卡记录不存在或无权操作' };
    }
    return {
      ok: true,
      message: '已取消打卡',
      data: null
    };
  }
};

module.exports = [listDayCheckins, addCheckin, cancelCheckin];
