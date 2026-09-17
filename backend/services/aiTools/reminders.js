const Medicine = require('../../models/Medicine');
const Reminder = require('../../models/Reminder');
const validate = require('../../utils/validate');

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
// 格式化单个天数
const formatDay = (day) => `周${DAY_LABELS[Number(day)]}`;
// 格式化天数数组
const formatDays = (days) => days.map((d) => formatDay(d)).join('、');

const listReminders = {
  name: 'list_reminders',
  kind: 'read',
  definition: {
    type: 'function',
    function: {
      name: 'list_reminders',
      description:
        '查询用药提醒列表。可选按 medicineId 筛选；改/删提醒前须先调用本工具拿到真实 reminderId。',
      parameters: {
        type: 'object',
        properties: {
          medicineId: {
            type: 'integer',
            description: '可选。药品ID；不传则返回全部。'
          }
        },
        additionalProperties: false
      }
    }
  },
  run: async (userId, args) => {
    let list = await Reminder.findByUser(userId);

    // 如果传了medicineId，按药品过滤
    const medicineId = args?.medicineId;
    if (validate.isNotEmpty(medicineId)) {
      if (!validate.isIdValid(medicineId)) {
        return { error: 'medicineId无效' };
      }
      list = list.filter((r) => Number(r.medicineId) === Number(medicineId));
    }

    return list.map((r) => ({
      id: r.id,
      medicineId: r.medicineId,
      medicineName: r.medicineName,
      time: r.time,
      days: r.days,
      enabled: r.enabled
    }));
  }
};

const createReminder = {
  name: 'create_reminder',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'create_reminder',
      description:
        '创建用药提醒。须先 list_medicines 拿到真实 medicineId。days 为 0-6 的数组（0=周日）；time 为 HH:MM。直接调用本工具，由系统确认卡执行；不要口头二次确认，不要声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          medicineId: { type: 'integer', description: '药品ID（须为真实ID）' },
          medicineName: {
            type: 'string',
            description: '可选。药品名称仅供参考，服务端会以medicineId对应库中名称为准'
          },
          time: { type: 'string', description: '提醒时间，HH:MM，如 08:00' },
          days: {
            type: 'array',
            items: { type: 'integer' },
            description: '星期数组，每项 0-6（0=周日...6=周六）；「明天」只传对应的一个数字'
          },
          enabled: { type: 'boolean', description: '默认true' }
        },
        required: ['medicineId', 'time', 'days']
      }
    }
  },
  // 校验失败回填给模型的提示
  failHint: '请先调用 list_medicines 核对 medicineId，再重新调用 create_reminder',
  // 校验并规范化「待确认」的创建提醒参数(还不写库)
  buildPending: async (userId, args) => {
    const medicineId = args?.medicineId;
    const time = args?.time;
    const days = args?.days;
    const enabled = args?.enabled === undefined ? true : args.enabled;

    if (!validate.isIdValid(medicineId)) {
      return { ok: false, message: 'medicineId无效' };
    }
    if (!validate.isTimeValid(time)) {
      return { ok: false, message: 'time格式应为HH:MM' };
    }
    if (!validate.isDaysArrayValid(days)) {
      return { ok: false, message: 'days无效' };
    }
    if (!validate.isBooleanValid(enabled)) {
      return { ok: false, message: 'enabled无效' };
    }

    // 药品名称以数据库为准
    const medicine = await Medicine.findById(medicineId, userId);
    if (!medicine) {
      return { ok: false, message: '药品不存在或无权操作' };
    }
    const medicineName = medicine.name;

    const daysText = formatDays(days);

    return {
      ok: true,
      pendingAction: {
        type: 'create_reminder',
        summary: `为${medicineName}创建提醒：${daysText} ${String(time).trim()}`,
        fields: [
          { label: '药品', value: medicineName },
          { label: '时间', value: String(time).trim() },
          { label: '重复', value: daysText }
        ],
        payload: {
          medicineId: Number(medicineId),
          time: String(time).trim(),
          days: days.map((d) => Number(d)),
          enabled
        },
        resultText: {
          done: '已创建提醒，可在「提醒」页面查看',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const { medicineId, time, days, enabled } = payload || {};

    const medicine = await Medicine.findById(medicineId, userId);
    if (!medicine) {
      return { ok: false, message: '药品不存在或无权操作' };
    }

    const rows = days.map((d) => ({
      medicine_id: Number(medicineId),
      user_id: userId,
      time: String(time).trim(),
      days: d,
      enabled: enabled !== false
    }));
    const ids = await Reminder.createMany(rows);

    const created = [];
    for (const id of ids) {
      const row = await Reminder.findById(id, userId);
      if (row) created.push(row);
    }

    return {
      ok: true,
      message: `已创建${created.length}条提醒`,
      data: created
    };
  }
};

const updateReminder = {
  name: 'update_reminder',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'update_reminder',
      description:
        '更新一条提醒（时间/星期/开关/药品）。须先 list_reminders 拿到真实 reminderId。days 为单个 0-6（不是数组）；未传字段保持原值；关闭提醒传 enabled=false。直接调用本工具，由系统确认卡执行；不要口头二次确认，不要声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          reminderId: { type: 'integer', description: '提醒ID（须为真实ID）' },
          medicineId: { type: 'integer', description: '药品ID' },
          time: { type: 'string', description: '提醒时间，HH:MM，如 08:00' },
          days: {
            type: 'integer',
            description:
              '单个0-6的数字，0=周日 ... 6=周六。不传保持原值。明天只传明天对应的一个数字'
          },
          enabled: { type: 'boolean', description: '可选；不传保持原值；关闭传false' }
        },
        required: ['reminderId']
      }
    }
  },
  failHint: '请先调用 list_reminders 核对 reminderId，再重新调用 update_reminder',
  buildPending: async (userId, args) => {
    const reminderId = args?.reminderId;
    if (!validate.isIdValid(reminderId)) {
      return { ok: false, message: 'reminderId无效' };
    }

    const reminder = await Reminder.findById(reminderId, userId);
    if (!reminder) {
      return { ok: false, message: '提醒不存在或无权操作' };
    }

    // 未传的字段用原行补齐
    const medicineId = validate.isNotEmpty(args?.medicineId)
      ? args.medicineId
      : reminder.medicineId;
    const time = validate.isNotEmpty(args?.time) ? args.time : reminder.time;
    const days = validate.isNotEmpty(args?.days) ? args.days : reminder.days;
    const enabled = args?.enabled === undefined ? reminder.enabled : args.enabled;

    if (!validate.isIdValid(medicineId)) {
      return { ok: false, message: 'medicineId无效' };
    }
    if (!validate.isTimeValid(time)) {
      return { ok: false, message: 'time格式应为HH:MM' };
    }
    if (!validate.isDayValid(days)) {
      return { ok: false, message: 'days无效，应为0-6的单个数字' };
    }
    if (!validate.isBooleanValid(enabled)) {
      return { ok: false, message: 'enabled无效' };
    }

    // 药品名称以数据库为准
    const medicine = await Medicine.findById(medicineId, userId);
    if (!medicine) {
      return { ok: false, message: '药品不存在或无权操作' };
    }
    const medicineName = medicine.name;
    const daysText = formatDay(days);
    const enabledText = enabled ? '开启' : '关闭';

    return {
      ok: true,
      pendingAction: {
        type: 'update_reminder',
        summary: `更新提醒：${medicineName} ${daysText} ${String(time).trim()}（${enabledText}）`,
        fields: [
          { label: '药品', value: medicineName },
          { label: '时间', value: String(time).trim() },
          { label: '重复', value: daysText },
          { label: '提醒状态', value: enabledText }
        ],
        payload: {
          reminderId: Number(reminderId),
          medicineId: Number(medicineId),
          time: String(time).trim(),
          days: Number(days),
          enabled: Boolean(enabled)
        },
        resultText: {
          done: '已更新提醒，可在「提醒」页面查看',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const { reminderId, medicineId, time, days, enabled } = payload || {};

    const row = await Reminder.findById(reminderId, userId);
    if (!row) {
      return { ok: false, message: '提醒不存在或无权操作' };
    }

    const medicine = await Medicine.findById(medicineId, userId);
    if (!medicine) {
      return { ok: false, message: '药品不存在或无权操作' };
    }

    const updated = await Reminder.update(reminderId, userId, {
      medicine_id: Number(medicineId),
      time: String(time).trim(),
      days: Number(days),
      enabled: Boolean(enabled)
    });
    if (!updated) {
      return { ok: false, message: '更新提醒失败' };
    }

    return {
      ok: true,
      message: '已更新提醒',
      data: null
    };
  }
};

const deleteReminder = {
  name: 'delete_reminder',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'delete_reminder',
      description:
        '删除一条提醒。须先 list_reminders 拿到真实 reminderId。直接调用本工具，由系统确认卡执行；不要口头二次确认，不要声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          reminderId: { type: 'integer', description: '提醒ID（须为真实ID）' }
        },
        required: ['reminderId']
      }
    }
  },
  failHint: '请先调用 list_reminders 核对 reminderId，再重新调用 delete_reminder',
  buildPending: async (userId, args) => {
    const reminderId = args?.reminderId;
    if (!validate.isIdValid(reminderId)) {
      return { ok: false, message: 'reminderId无效' };
    }

    const reminder = await Reminder.findById(reminderId, userId);
    if (!reminder) {
      return { ok: false, message: '提醒不存在或无权操作' };
    }
    const medicineName = reminder.medicineName;
    const time = reminder.time;
    const days = reminder.days;

    // 单个数字
    const daysText = formatDay(days);

    return {
      ok: true,
      pendingAction: {
        type: 'delete_reminder',
        summary: `删除提醒：${daysText} ${String(time).trim()} ${medicineName} 的提醒`,
        fields: [
          { label: '药品', value: medicineName },
          { label: '时间', value: String(time).trim() },
          { label: '重复', value: daysText }
        ],
        payload: {
          reminderId: Number(reminderId)
        },
        resultText: {
          done: '已删除提醒',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const { reminderId } = payload || {};

    const row = await Reminder.findById(reminderId, userId);
    if (!row) {
      return { ok: false, message: '提醒不存在或无权操作' };
    }

    await Reminder.delete(reminderId, userId);
    return {
      ok: true,
      message: '已删除提醒',
      data: null
    };
  }
};

module.exports = [listReminders, createReminder, updateReminder, deleteReminder];
