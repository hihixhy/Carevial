const HealthProfile = require('../models/HealthProfile');
const validate = require('../utils/validate');

// 解析健康档案请求体
const parseProfileBody = (body) => {
  const bloodType = body.bloodType;
  const allergies = body.allergies;
  const chronicConditions = body.chronicConditions;
  const contraindications = body.contraindications;
  const medicalNotes = body.medicalNotes;

  if (!validate.isBloodTypeValidIfPresent(bloodType)) {
    return { ok: false, message: '血型格式无效' };
  }
  if (!validate.isStringArrayValid(allergies ?? [])) {
    return { ok: false, message: '过敏史格式无效' };
  }
  if (!validate.isStringArrayValid(chronicConditions ?? [])) {
    return { ok: false, message: '慢性病格式无效' };
  }
  if (!validate.isStringArrayValid(contraindications ?? [])) {
    return { ok: false, message: '用药禁忌格式无效' };
  }
  if (!validate.isMedicalNotesValidIfPresent(medicalNotes)) {
    return { ok: false, message: '备注不能超过1000个字符' };
  }

  // 将非数组转换为数组，将每一项转换为字符串并去除空格，过滤掉空字符串
  const normalizeArr = (arr) =>
    (Array.isArray(arr) ? arr : []).map((s) => String(s).trim()).filter(Boolean);

  return {
    ok: true,
    data: {
      blood_type: validate.isNotEmpty(bloodType) ? String(bloodType).trim() : null,
      allergies: normalizeArr(allergies),
      chronic_conditions: normalizeArr(chronicConditions),
      contraindications: normalizeArr(contraindications),
      medical_notes: validate.isNotEmpty(medicalNotes) ? String(medicalNotes).trim() : null
    }
  };
};

exports.getProfiles = async (req, res) => {
  try {
    const list = await HealthProfile.findByUser(req.userId);
    return res.status(200).json({
      code: 200,
      message: '获取健康档案列表成功',
      data: list
    });
  } catch (err) {
    console.error('获取健康档案列表失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.updateProfile = async (req, res) => {
  const { memberId } = req.params;
  if (!validate.isIdValid(memberId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的家庭成员ID',
      data: null
    });
  }

  const parsed = parseProfileBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      code: 400,
      message: parsed.message,
      data: null
    });
  }

  try {
    const updated = await HealthProfile.update(memberId, req.userId, parsed.data);
    if (!updated) {
      return res.status(404).json({
        code: 404,
        message: '健康档案不存在或无权限更新',
        data: null
      });
    }
    return res.status(200).json({
      code: 200,
      message: '健康档案更新成功',
      data: null
    });
  } catch (err) {
    console.error('更新健康档案失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};
