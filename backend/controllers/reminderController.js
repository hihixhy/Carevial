const Reminder = require('../models/Reminder');
const Medicine = require('../models/Medicine');
const validate = require('../utils/validate');

const parseEnabled = (enabled) => {
  if (enabled === undefined) return { ok: true, value: true };
  if (!validate.isBooleanValid(enabled)) {
    return { ok: false, message: '提醒启用状态无效' };
  }
  return { ok: true, value: enabled };
};

const parseCreateBody = (body) => {
  const medicineId = body.medicineId;
  const time = body.time;
  const days = body.days; // 数组
  const enabledResult = parseEnabled(body.enabled);
  if (!enabledResult.ok) return enabledResult;

  if (!validate.isIdValid(medicineId)) return { ok: false, message: '无效的药品ID' };
  if (!validate.isTimeValid(time)) return { ok: false, message: '提醒时间格式错误，应为HH:mm' };
  if (!validate.isDaysArrayValid(days))
    return { ok: false, message: '请选择有效的星期（0-6，不能重复）' };

  return {
    ok: true,
    data: {
      medicine_id: Number(medicineId),
      time: String(time).trim(),
      days: days.map((d) => Number(d)),
      enabled: enabledResult.value
    }
  };
};

const parseUpdateBody = (body) => {
  const medicineId = body.medicineId;
  const time = body.time;
  const days = body.days; // 单个数字
  const enabledResult = parseEnabled(body.enabled);
  if (!enabledResult.ok) return enabledResult;

  if (!validate.isIdValid(medicineId)) return { ok: false, message: '无效的药品ID' };
  if (!validate.isTimeValid(time)) return { ok: false, message: '提醒时间格式错误，应为HH:mm' };
  if (!validate.isDayValid(days)) return { ok: false, message: '星期无效，应为0-6' };

  return {
    ok: true,
    data: {
      medicine_id: Number(medicineId),
      time: String(time).trim(),
      days: Number(days),
      enabled: enabledResult.value
    }
  };
};

exports.getReminders = async (req, res) => {
  try {
    const list = await Reminder.findByUser(req.userId);
    return res.status(200).json({
      code: 200,
      message: '获取提醒列表成功',
      data: list
    });
  } catch (err) {
    console.error('获取提醒列表失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.getRemindersByMedicine = async (req, res) => {
  const { medicineId } = req.params;
  if (!validate.isIdValid(medicineId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的药品ID',
      data: null
    });
  }

  try {
    const medicine = await Medicine.findById(medicineId, req.userId);
    if (!medicine) {
      return res.status(404).json({
        code: 404,
        message: '药品不存在或无权限访问',
        data: null
      });
    }
    const list = await Reminder.findByMedicine(medicineId, req.userId);
    return res.status(200).json({
      code: 200,
      message: '获取药品提醒成功',
      data: list
    });
  } catch (err) {
    console.error('获取药品提醒失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.addReminder = async (req, res) => {
  const parsed = parseCreateBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      code: 400,
      message: parsed.message,
      data: null
    });
  }

  try {
    const { medicine_id, time, days, enabled } = parsed.data;
    const medicine = await Medicine.findById(medicine_id, req.userId);
    if (!medicine) {
      return res.status(404).json({
        code: 404,
        message: '药品不存在或无权限访问',
        data: null
      });
    }

    const rows = days.map((d) => ({
      medicine_id,
      user_id: req.userId,
      time,
      days: d,
      enabled
    }));
    const ids = await Reminder.createMany(rows);

    // 把新建的提醒查询出来，返回给前端
    const created = [];
    for (const id of ids) {
      const row = await Reminder.findById(id, req.userId);
      if (row) created.push(row);
    }

    return res.status(200).json({
      code: 200,
      message: '提醒添加成功',
      data: created
    });
  } catch (err) {
    console.error('添加提醒失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.updateReminder = async (req, res) => {
  const { id } = req.params;
  if (!validate.isIdValid(id)) {
    return res.status(400).json({
      code: 400,
      message: '无效的提醒ID',
      data: null
    });
  }

  const parsed = parseUpdateBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      code: 400,
      message: parsed.message,
      data: null
    });
  }

  try {
    const medicine = await Medicine.findById(parsed.data.medicine_id, req.userId);
    if (!medicine) {
      return res.status(404).json({
        code: 404,
        message: '药品不存在或无权限访问',
        data: null
      });
    }

    const updated = await Reminder.update(id, req.userId, parsed.data);
    if (!updated) {
      return res.status(404).json({
        code: 404,
        message: '提醒不存在或无权限更新',
        data: null
      });
    }
    return res.status(200).json({
      code: 200,
      message: '提醒更新成功',
      data: null
    });
  } catch (err) {
    console.error('更新提醒失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.deleteReminder = async (req, res) => {
  const { id } = req.params;
  if (!validate.isIdValid(id)) {
    return res.status(400).json({
      code: 400,
      message: '无效的提醒ID',
      data: null
    });
  }

  try {
    const deleted = await Reminder.delete(id, req.userId);
    if (!deleted) {
      return res.status(404).json({
        code: 404,
        message: '提醒不存在或无权限删除',
        data: null
      });
    }
    return res.status(200).json({
      code: 200,
      message: '提醒删除成功',
      data: null
    });
  } catch (err) {
    console.error('删除提醒失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};
