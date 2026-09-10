const FamilyMember = require('../models/FamilyMember');
const Medicine = require('../models/Medicine');
const validate = require('../utils/validate');

// 解析并校验家庭成员请求体
const parseMemberBody = (body) => {
  const name = String(body.name || '').trim();
  const age = body.age;
  const relationship = String(body.relationship || '').trim();

  if (!validate.isNotEmpty(name) || name.length > 50) {
    return { ok: false, message: '姓名不能为空且不超过50个字符' };
  }
  if (!validate.isAgeValidIfPresent(age)) {
    return { ok: false, message: '年龄需为0-120之间的整数' };
  }
  if (!validate.isNotEmpty(relationship) || relationship.length > 50) {
    return { ok: false, message: '关系不能为空且不超过50个字符' };
  }

  return {
    ok: true,
    data: {
      name,
      age: validate.isNotEmpty(age) ? Number(age) : null,
      relationship
    }
  };
};

// 获取用户家庭成员列表
exports.getMembers = async (req, res) => {
  try {
    const members = await FamilyMember.findByUser(req.userId);
    return res.status(200).json({
      code: 200,
      message: '获取家庭成员列表成功',
      data: members
    });
  } catch (err) {
    console.error('获取家庭成员列表失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

exports.addMember = async (req, res) => {
  const parsed = parseMemberBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      code: 400,
      message: parsed.message,
      data: null
    });
  }

  try {
    const id = await FamilyMember.create({
      user_id: req.userId,
      ...parsed.data
    });
    return res.status(200).json({
      code: 200,
      message: '家庭成员添加成功',
      data: {
        id,
        ...parsed.data
      }
    });
  } catch (err) {
    console.error('添加家庭成员失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

exports.updateMember = async (req, res) => {
  const { id } = req.params;
  if (!validate.isIdValid(id)) {
    return res.status(400).json({
      code: 400,
      message: '无效的家庭成员ID',
      data: null
    });
  }

  const parsed = parseMemberBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      code: 400,
      message: parsed.message,
      data: null
    });
  }

  try {
    const updated = await FamilyMember.update(id, req.userId, parsed.data);
    if (!updated) {
      return res.status(404).json({
        code: 404,
        message: '家庭成员不存在或无权限更新',
        data: null
      });
    }
    return res.status(200).json({
      code: 200,
      message: '家庭成员更新成功',
      data: null
    });
  } catch (err) {
    console.error('更新家庭成员失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

exports.deleteMember = async (req, res) => {
  const { id } = req.params;
  if (!validate.isIdValid(id)) {
    return res.status(400).json({
      code: 400,
      message: '无效的家庭成员ID',
      data: null
    });
  }

  try {
    const deleted = await FamilyMember.delete(id, req.userId);
    if (!deleted) {
      return res.status(404).json({
        code: 404,
        message: '家庭成员不存在或无权限删除',
        data: null
      });
    }
    return res.status(200).json({
      code: 200,
      message: '家庭成员删除成功',
      data: null
    });
  } catch (err) {
    console.error('删除家庭成员失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};

// 获取家庭成员关联的药品数量
exports.getMedicineCount = async (req, res) => {
  const { id } = req.params;
  if (!validate.isIdValid(id)) {
    return res.status(400).json({
      code: 400,
      message: '无效的家庭成员ID',
      data: null
    });
  }

  try {
    const member = await FamilyMember.findById(id, req.userId);
    if (!member) {
      return res.status(404).json({
        code: 404,
        message: '家庭成员不存在或无权限访问',
        data: null
      });
    }
    const count = await Medicine.countByMember(id, req.userId);
    return res.status(200).json({
      code: 200,
      message: '获取关联药品数量成功',
      data: { count }
    });
  } catch (err) {
    console.error('获取关联药品数量失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误,请稍后再试',
      data: null
    });
  }
};
