const Medicine = require('../models/Medicine');
const Reminder = require('../models/Reminder');
const validate = require('../utils/validate');

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'list_medicines',
      description: '查询当前登录用户药箱中的药品列表，用于把药名解析成medicineId',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_reminder',
      description:
        '创建用药提醒。days为0-6的数组（0=周日）。time为HH:MM。必须先list_medicines拿到真实medicineId。此操作需要用户确认后才会真正执行。',
      parameters: {
        type: 'object',
        properties: {
          medicineId: { type: 'integer', description: '药品ID' },
          medicineName: {
            type: 'string',
            description: '可选。药品名称仅供参考，服务端会以medicineId对应库中名称为准'
          },
          time: { type: 'string', description: 'HH:MM，如 08:00' },
          days: {
            type: 'array',
            items: { type: 'integer' },
            description: '星期数组，0=周日 ... 6=周六。明天只传明天对应的一个数字'
          },
          enabled: { type: 'boolean', description: '默认true' }
        },
        required: ['medicineId', 'time', 'days']
      }
    }
  }
];

const WRITE_TOOLS = new Set(['create_reminder']);
const isWriteTool = (name) => WRITE_TOOLS.has(name);

// 只读工具
const runReadTool = async (userId, name) => {
  if (name === 'list_medicines') {
    const list = await Medicine.findByUser(userId);
    return list.map((m) => ({
      id: m.id,
      name: m.name,
      medicineType: m.medicineType,
      memberName: m.memberName || null
    }));
  }
  throw new Error(`未知只读工具: ${name}`);
};

// 校验并规范化「待确认」的创建提醒参数(还不写库)
const buildPendingCreateReminder = async (userId, args) => {
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

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
  const daysText = days.map((d) => `周${dayLabels[Number(d)]}`).join('、');

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
};

// 用户确认后执行写库操作
const executeConfirmedAction = async (userId, pendingAction) => {
  if (!pendingAction || pendingAction.type !== 'create_reminder') {
    return { ok: false, message: '不支持的操作类型' };
  }
  const { medicineId, time, days, enabled } = pendingAction.payload || {};

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
};

module.exports = {
  TOOL_DEFINITIONS,
  isWriteTool,
  runReadTool,
  buildPendingCreateReminder,
  executeConfirmedAction
};
