const Medicine = require('../models/Medicine');
const FamilyMember = require('../models/FamilyMember');
const validate = require('../utils/validate');
const { uploadImageBuffer } = require('../utils/cosUpload');
const { deleteCosByUrl } = require('../utils/deleteCos');

// 解析药品请求体
const parseMedicineBody = (body) => {
  const memberId = body.memberId;
  const name = String(body.name || '').trim();
  const specification = body.specification;
  const expiryDate = body.expiryDate;
  const dosage = body.dosage;
  const indications = body.indications;
  const medicineType = body.medicineType;
  const remark = body.remark;

  let member_id = null;
  if (validate.isNotEmpty(memberId)) {
    if (!validate.isIdValid(memberId)) {
      return { ok: false, message: '无效的家庭成员ID' };
    }
    member_id = Number(memberId);
  }

  if (!validate.isNotEmpty(name) || name.length > 100) {
    return { ok: false, message: '药品名称不能为空且不超过100个字符' };
  }
  if (!validate.isOptionalStringMax(specification, 100)) {
    return { ok: false, message: '药品规格不能超过100个字符' };
  }
  if (!validate.isExpiryDateValid(expiryDate)) {
    return { ok: false, message: '有效期不能为空，且格式为YYYY-MM-DD' };
  }
  if (!validate.isOptionalStringMax(dosage, 200)) {
    return { ok: false, message: '用法用量不能超过200个字符' };
  }
  if (!validate.isOptionalStringMax(indications, 255)) {
    return { ok: false, message: '适应症不能超过255个字符' };
  }
  if (!validate.isMedicineTypeValid(medicineType)) {
    return { ok: false, message: '药品类型无效' };
  }
  if (!validate.isOptionalStringMax(remark, 500)) {
    return { ok: false, message: '备注不能超过500个字符' };
  }

  return {
    ok: true,
    data: {
      member_id,
      name,
      specification: validate.isNotEmpty(specification) ? String(specification).trim() : null,
      expiry_date: String(expiryDate).trim().slice(0, 10),
      dosage: validate.isNotEmpty(dosage) ? String(dosage).trim() : null,
      indications: validate.isNotEmpty(indications) ? String(indications).trim() : null,
      medicine_type: String(medicineType).trim(),
      remark: validate.isNotEmpty(remark) ? String(remark).trim() : null,
      photo_url: null,
      touchPhoto: false // 本次要不要改数据库的photo_url
    }
  };
};

// 获取用户药品列表
exports.getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.findByUser(req.userId);
    return res.status(200).json({
      code: 200,
      message: '获取药品列表成功',
      data: medicines
    });
  } catch (err) {
    console.error('获取药品列表失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

// 获取药品详情
exports.getMedicine = async (req, res) => {
  const { id } = req.params;
  if (!validate.isIdValid(id)) {
    return res.status(400).json({
      code: 400,
      message: '无效的药品ID',
      data: null
    });
  }

  try {
    const medicine = await Medicine.findById(id, req.userId);
    if (!medicine) {
      return res.status(404).json({
        code: 404,
        message: '药品不存在或无权限查看',
        data: null
      });
    }
    return res.status(200).json({
      code: 200,
      message: '获取药品详情成功',
      data: medicine
    });
  } catch (err) {
    console.error('获取药品详情失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.addMedicine = async (req, res) => {
  const parsed = parseMedicineBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      code: 400,
      message: parsed.message,
      data: null
    });
  }

  let newUrl = null;
  try {
    const { member_id } = parsed.data;
    if (member_id) {
      const member = await FamilyMember.findById(member_id, req.userId);
      if (!member) {
        return res.status(404).json({
          code: 404,
          message: '家庭成员不存在或无权限访问',
          data: null
        });
      }
    }

    if (req.file) {
      newUrl = await uploadImageBuffer(req.file.buffer);
      parsed.data.photo_url = newUrl;
    } else {
      parsed.data.photo_url = null;
    }

    const id = await Medicine.create({ user_id: req.userId, ...parsed.data });
    const medicine = await Medicine.findById(id, req.userId);
    return res.status(200).json({
      code: 200,
      message: '药品添加成功',
      data: medicine
    });
  } catch (err) {
    // 上传成功但是create失败，需要删除图片
    if (newUrl) {
      await deleteCosByUrl(newUrl);
    }
    console.error('添加药品失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.updateMedicine = async (req, res) => {
  const { id } = req.params;
  if (!validate.isIdValid(id)) {
    return res.status(400).json({
      code: 400,
      message: '无效的药品ID',
      data: null
    });
  }

  const parsed = parseMedicineBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      code: 400,
      message: parsed.message,
      data: null
    });
  }

  // FormData传过来的都是字符串，把clearPhoto转布尔标记
  const clearPhoto =
    req.body.clearPhoto === '1' || req.body.clearPhoto === 'true' || req.body.clearPhoto === true;

  let newUrl = null;
  try {
    const { member_id } = parsed.data;
    if (member_id) {
      const member = await FamilyMember.findById(member_id, req.userId);
      if (!member) {
        return res.status(404).json({
          code: 404,
          message: '家庭成员不存在或无权限访问',
          data: null
        });
      }
    }

    const existing = await Medicine.findById(id, req.userId);
    if (!existing) {
      return res.status(404).json({
        code: 404,
        message: '药品不存在或无权限更新',
        data: null
      });
    }
    const oldUrl = existing.photoUrl || null;

    if (req.file) {
      // 改图片
      newUrl = await uploadImageBuffer(req.file.buffer);
      parsed.data.photo_url = newUrl;
      parsed.data.touchPhoto = true;
    } else if (clearPhoto) {
      // 删除图片
      parsed.data.photo_url = null;
      parsed.data.touchPhoto = true;
    } else {
      // 不改图片
      parsed.data.touchPhoto = false;
    }

    const updated = await Medicine.update(id, req.userId, parsed.data);
    if (!updated) {
      // 上传成功但是update失败，需要删除图片
      if (newUrl) await deleteCosByUrl(newUrl);

      return res.status(404).json({
        code: 404,
        message: '药品不存在或无权限更新',
        data: null
      });
    }

    // 写库成功再删旧图
    if (parsed.data.touchPhoto && oldUrl && oldUrl !== parsed.data.photo_url) {
      await deleteCosByUrl(oldUrl);
    }

    return res.status(200).json({
      code: 200,
      message: '药品更新成功',
      data: null
    });
  } catch (err) {
    // 上传成功但是update失败，需要删除图片
    if (newUrl) await deleteCosByUrl(newUrl);

    console.error('更新药品失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.deleteMedicine = async (req, res) => {
  const { id } = req.params;
  if (!validate.isIdValid(id)) {
    return res.status(400).json({
      code: 400,
      message: '无效的药品ID',
      data: null
    });
  }

  try {
    const existing = await Medicine.findById(id, req.userId);
    if (!existing) {
      return res.status(404).json({
        code: 404,
        message: '药品不存在或无权限删除',
        data: null
      });
    }
    const oldUrl = existing.photoUrl || null;

    const deleted = await Medicine.delete(id, req.userId);
    if (!deleted) {
      return res.status(404).json({
        code: 404,
        message: '药品不存在或无权限删除',
        data: null
      });
    }

    if (oldUrl) {
      await deleteCosByUrl(oldUrl);
    }

    return res.status(200).json({
      code: 200,
      message: '药品删除成功',
      data: null
    });
  } catch (err) {
    console.error('删除药品失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};
