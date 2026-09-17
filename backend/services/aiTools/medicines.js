const FamilyMember = require('../../models/FamilyMember');
const Medicine = require('../../models/Medicine');
const validate = require('../../utils/validate');

const TYPE_LABELS = {
  prescription: '处方药',
  otc: '非处方药',
  healthcare: '保健品'
};

const listMedicines = {
  name: 'list_medicines',
  kind: 'read',
  definition: {
    type: 'function',
    function: {
      name: 'list_medicines',
      description: '查询药箱药品列表。用于把药名解析成真实 medicineId；memberId 为空表示家庭公用。',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  // 只读工具
  run: async (userId) => {
    const list = await Medicine.findByUser(userId);
    return list.map((m) => ({
      id: m.id,
      name: m.name,
      medicineType: m.medicineType,
      memberId: m.memberId ?? null,
      memberName: m.memberName || null,
      expiryDate: m.expiryDate,
      specification: m.specification || null,
      indications: m.indications || null,
      dosage: m.dosage || null,
      remark: m.remark || null
    }));
  }
};

const createMedicine = {
  name: 'create_medicine',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'create_medicine',
      description:
        '添加药品到药箱（仅文字信息：名称、类型、有效期等）。不支持上传或设置药品照片；若用户要求传图，应说明请到「药品」页面自行上传，仍可先添加无照片的药品。指定归属成员时先 list_family_members；有成员时还须先 list_health_profiles，高风险勿直接调用（见系统用药安全规则）。不传 memberId表示家庭公用。直接调用，由确认卡执行；勿口头确认、勿声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          memberId: { type: 'integer', description: '可选。家庭成员ID；不传表示家庭公用' },
          name: { type: 'string', description: '药品名称，不超过100个字符' },
          specification: { type: 'string', description: '药品规格，不超过100个字符' },
          expiryDate: { type: 'string', description: '有效期，格式 YYYY-MM-DD' },
          dosage: { type: 'string', description: '用法用量，不超过200个字符' },
          indications: { type: 'string', description: '适应症，不超过255个字符' },
          medicineType: {
            type: 'string',
            description:
              '药品类型，只能是 prescription（处方药）| otc（非处方药）| healthcare（保健品）'
          },
          remark: { type: 'string', description: '备注，不超过500个字符' }
        },
        required: ['name', 'expiryDate', 'medicineType']
      }
    }
  },
  failHint:
    '请核对 name、expiryDate、medicineType；归属成员须先 list_family_members 再调用 create_medicine。本工具不支持上传照片',
  buildPending: async (userId, args) => {
    const memberId = validate.isNotEmpty(args?.memberId) ? Number(args.memberId) : null;
    const name = String(args?.name || '').trim();
    const specification = args?.specification;
    const expiryDate = args?.expiryDate;
    const dosage = args?.dosage;
    const indications = args?.indications;
    const medicineType = args?.medicineType;
    const remark = args?.remark;

    let memberName = '家庭公用';
    if (validate.isNotEmpty(memberId)) {
      if (!validate.isIdValid(memberId)) {
        return { ok: false, message: 'memberId无效' };
      }
      const member = await FamilyMember.findById(memberId, userId);
      if (!member) {
        return { ok: false, message: '该家庭成员不存在或无权操作' };
      }
      memberName = member.name;
    }
    if (!validate.isNotEmpty(name) || name.length > 100) {
      return { ok: false, message: '药品名称不能为空且不超过100个字符' };
    }
    if (!validate.isOptionalStringMax(specification, 100)) {
      return { ok: false, message: '药品规格不超过100个字符' };
    }
    if (!validate.isDateValid(expiryDate)) {
      return { ok: false, message: '有效期不能为空，且格式为YYYY-MM-DD' };
    }
    if (!validate.isOptionalStringMax(dosage, 200)) {
      return { ok: false, message: '用法用量不超过200个字符' };
    }
    if (!validate.isOptionalStringMax(indications, 255)) {
      return { ok: false, message: '适应症不超过255个字符' };
    }
    if (!validate.isMedicineTypeValid(medicineType)) {
      return { ok: false, message: '药品类型无效，只能是 prescription|otc|healthcare' };
    }
    if (!validate.isOptionalStringMax(remark, 500)) {
      return { ok: false, message: '备注不超过500个字符' };
    }

    return {
      ok: true,
      pendingAction: {
        type: 'create_medicine',
        summary: `添加药品：${name}`,
        fields: [
          { label: '药品名称', value: name },
          { label: '药品类型', value: TYPE_LABELS[medicineType] },
          { label: '服用人员', value: memberName },
          { label: '有效期', value: expiryDate },
          { label: '药品规格', value: specification || '未填' },
          { label: '适应症', value: indications || '未填' },
          { label: '用法用量', value: dosage || '未填' },
          { label: '备注', value: remark || '未填' }
        ],
        payload: {
          memberId,
          name,
          specification: validate.isNotEmpty(specification) ? String(specification).trim() : null,
          expiryDate: String(expiryDate).trim().slice(0, 10),
          dosage: validate.isNotEmpty(dosage) ? String(dosage).trim() : null,
          indications: validate.isNotEmpty(indications) ? String(indications).trim() : null,
          medicineType: String(medicineType).trim(),
          remark: validate.isNotEmpty(remark) ? String(remark).trim() : null
        },
        resultText: {
          done: '已添加药品，可在「药品」页面查看',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const { memberId, name, specification, expiryDate, dosage, indications, medicineType, remark } =
      payload || {};

    if (memberId != null) {
      const member = await FamilyMember.findById(memberId, userId);
      if (!member) {
        return { ok: false, message: '该家庭成员不存在或无权操作' };
      }
    }

    const medicineId = await Medicine.create({
      user_id: userId,
      member_id: memberId,
      name,
      specification,
      expiry_date: expiryDate,
      dosage,
      indications,
      medicine_type: medicineType,
      remark,
      photo_url: null
    });
    return {
      ok: true,
      message: '已添加药品',
      data: {
        id: medicineId
      }
    };
  }
};

const updateMedicine = {
  name: 'update_medicine',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'update_medicine',
      description:
        '更新药品文字信息。须先 list_medicines 拿到真实 medicineId。未传字段保持原值。不支持上传、更换或清除照片；改图请到「药品」页面。直接调用本工具，由系统确认卡执行；不要口头二次确认，不要声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          medicineId: { type: 'integer', description: '药品ID（须为真实ID）' },
          memberId: {
            type: 'integer',
            description: '家庭成员ID；不传保持原值；改为家庭公用请传空/null'
          },
          name: { type: 'string', description: '药品名称，不超过100个字符' },
          specification: {
            type: 'string',
            description: '药品规格，不超过100个字符；要清空请传空字符串'
          },
          expiryDate: { type: 'string', description: '有效期，格式 YYYY-MM-DD' },
          dosage: { type: 'string', description: '用法用量，不超过200个字符；要清空请传空字符串' },
          indications: {
            type: 'string',
            description: '适应症，不超过255个字符；要清空请传空字符串'
          },
          medicineType: {
            type: 'string',
            description:
              '药品类型，只能是 prescription（处方药）| otc（非处方药）| healthcare（保健品）'
          },
          remark: { type: 'string', description: '备注，不超过500个字符；要清空请传空字符串' }
        },
        required: ['medicineId']
      }
    }
  },
  failHint:
    '请先调用 list_medicines 核对 medicineId，再重新调用 update_medicine。本工具不支持修改照片',
  buildPending: async (userId, args) => {
    const medicineId = args?.medicineId;
    if (!validate.isIdValid(medicineId)) {
      return { ok: false, message: 'medicineId无效' };
    }
    const medicine = await Medicine.findById(medicineId, userId);
    if (!medicine) {
      return { ok: false, message: '药品不存在或无权操作' };
    }

    const memberId =
      args?.memberId === undefined
        ? medicine.memberId
        : validate.isNotEmpty(args.memberId)
          ? Number(args.memberId)
          : null; // 防止非法字符串"abc" -> NaN -> null
    const name = validate.isNotEmpty(args?.name) ? String(args.name).trim() : medicine.name;
    const specification =
      args?.specification === undefined
        ? medicine.specification
        : String(args.specification || '').trim() || null;
    const expiryDate = validate.isNotEmpty(args?.expiryDate)
      ? args.expiryDate
      : medicine.expiryDate;
    const dosage =
      args?.dosage === undefined ? medicine.dosage : String(args.dosage || '').trim() || null;
    const indications =
      args?.indications === undefined
        ? medicine.indications
        : String(args.indications || '').trim() || null;
    const medicineType = validate.isNotEmpty(args?.medicineType)
      ? String(args.medicineType).trim()
      : medicine.medicineType;
    const remark =
      args?.remark === undefined ? medicine.remark : String(args.remark || '').trim() || null;

    let memberName = '家庭公用';
    if (validate.isNotEmpty(memberId)) {
      if (!validate.isIdValid(memberId)) {
        return { ok: false, message: 'memberId无效' };
      }
      const member = await FamilyMember.findById(memberId, userId);
      if (!member) {
        return { ok: false, message: '该家庭成员不存在或无权操作' };
      }
      memberName = member.name;
    }
    if (!validate.isNotEmpty(name) || name.length > 100) {
      return { ok: false, message: '药品名称不能为空且不超过100个字符' };
    }
    if (!validate.isOptionalStringMax(specification, 100)) {
      return { ok: false, message: '药品规格不超过100个字符' };
    }
    if (!validate.isDateValid(expiryDate)) {
      return { ok: false, message: '有效期不能为空，且格式为YYYY-MM-DD' };
    }
    if (!validate.isOptionalStringMax(dosage, 200)) {
      return { ok: false, message: '用法用量不超过200个字符' };
    }
    if (!validate.isOptionalStringMax(indications, 255)) {
      return { ok: false, message: '适应症不超过255个字符' };
    }
    if (!validate.isMedicineTypeValid(medicineType)) {
      return { ok: false, message: '药品类型无效，只能是 prescription|otc|healthcare' };
    }
    if (!validate.isOptionalStringMax(remark, 500)) {
      return { ok: false, message: '备注不超过500个字符' };
    }

    return {
      ok: true,
      pendingAction: {
        type: 'update_medicine',
        summary: `更新药品：${name}`,
        fields: [
          { label: '药品名称', value: name },
          { label: '药品类型', value: TYPE_LABELS[medicineType] },
          { label: '服用人员', value: memberName },
          { label: '有效期', value: expiryDate },
          { label: '药品规格', value: specification || '未填' },
          { label: '适应症', value: indications || '未填' },
          { label: '用法用量', value: dosage || '未填' },
          { label: '备注', value: remark || '未填' }
        ],
        payload: {
          medicineId: Number(medicineId),
          memberId,
          name,
          specification: validate.isNotEmpty(specification) ? String(specification).trim() : null,
          expiryDate: String(expiryDate).trim().slice(0, 10),
          dosage: validate.isNotEmpty(dosage) ? String(dosage).trim() : null,
          indications: validate.isNotEmpty(indications) ? String(indications).trim() : null,
          medicineType: String(medicineType).trim(),
          remark: validate.isNotEmpty(remark) ? String(remark).trim() : null
        },
        resultText: {
          done: '已更新药品，可在「药品」页面查看',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const {
      medicineId,
      memberId,
      name,
      specification,
      expiryDate,
      dosage,
      indications,
      medicineType,
      remark
    } = payload || {};

    const row = await Medicine.findById(medicineId, userId);
    if (!row) {
      return { ok: false, message: '药品不存在或无权操作' };
    }

    if (validate.isNotEmpty(memberId)) {
      const member = await FamilyMember.findById(memberId, userId);
      if (!member) {
        return { ok: false, message: '该家庭成员不存在或无权操作' };
      }
    }

    const updated = await Medicine.update(medicineId, userId, {
      member_id: memberId,
      name,
      specification,
      expiry_date: expiryDate,
      dosage,
      indications,
      medicine_type: medicineType,
      remark,
      touchPhoto: false // 不更新照片
    });
    if (!updated) {
      return { ok: false, message: '更新药品失败' };
    }

    return {
      ok: true,
      message: '已更新药品',
      data: null
    };
  }
};

module.exports = [listMedicines, createMedicine, updateMedicine];
