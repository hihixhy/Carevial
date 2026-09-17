const HealthProfile = require('../../models/HealthProfile');
const validate = require('../../utils/validate');

// 规范化数组，去除空字符串，并返回字符串数组
const normalizeArr = (arr) =>
  (Array.isArray(arr) ? arr : []).map((s) => String(s).trim()).filter(Boolean);

// 格式化数组，用“、”连接，无数据时返回“无”
const formatArr = (arr) => (Array.isArray(arr) && arr.length ? arr.join('、') : '无');

const listHealthProfiles = {
  name: 'list_health_profiles',
  kind: 'read',
  definition: {
    type: 'function',
    function: {
      name: 'list_health_profiles',
      description:
        '查询家庭成员健康档案（血型、allergies过敏史、chronicConditions慢性病、contraindications用药禁忌、medicalNotes备注）。用药问答、为成员加药、改药品归属成员、为某人相关药设提醒前必须先调用本工具；可选 memberId 筛某一成员，称呼不清时先 list_family_members。更新档案前也用本工具核对 memberId。',
      parameters: {
        type: 'object',
        properties: {
          memberId: {
            type: 'integer',
            description: '可选。家庭成员真实 ID；已知就传，缩小结果。不传则返回全部成员档案。'
          }
        },
        additionalProperties: false
      }
    }
  },
  run: async (userId, args) => {
    let list = await HealthProfile.findByUser(userId);

    // 如果传了memberId，按memberId过滤
    const memberId = args?.memberId;
    if (validate.isNotEmpty(memberId)) {
      if (!validate.isIdValid(memberId)) {
        return { ok: false, message: 'memberId无效' };
      }
      list = list.filter((p) => Number(p.memberId) === Number(memberId));
    }

    return list.map((p) => ({
      memberId: p.memberId,
      name: p.name,
      relationship: p.relationship,
      age: p.age,
      bloodType: p.bloodType || null,
      allergies: p.allergies,
      chronicConditions: p.chronicConditions,
      contraindications: p.contraindications,
      medicalNotes: p.medicalNotes || null
    }));
  }
};

const updateHealthProfile = {
  name: 'update_health_profile',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'update_health_profile',
      description:
        '更新某成员健康档案。须先 list_health_profiles 或 list_family_members 拿到真实 memberId。未传字段保持原值。血型仅限 A型/B型/AB型/O型。直接调用本工具，由系统确认卡执行；不要口头二次确认，不要声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          memberId: { type: 'integer', description: '家庭成员ID（须为真实ID）' },
          bloodType: {
            type: 'string',
            description: '血型，A型/B型/AB型/O型；不传保持原值；要清空请传空字符串'
          },
          allergies: {
            type: 'array',
            items: { type: 'string' },
            description: '过敏史，不超过20项，单项不超过50字符；不传保持原值；空数组表示清空'
          },
          chronicConditions: {
            type: 'array',
            items: { type: 'string' },
            description: '慢性病，不超过20项，单项不超过50字符；不传保持原值；空数组表示清空'
          },
          contraindications: {
            type: 'array',
            items: { type: 'string' },
            description: '用药禁忌，不超过20项，单项不超过50字符；不传保持原值；空数组表示清空'
          },
          medicalNotes: {
            type: 'string',
            description: '备注，不超过1000字符；不传保持原值；要清空请传空字符串'
          }
        },
        required: ['memberId']
      }
    }
  },
  failHint: '请先调用 list_health_profiles 核对 memberId，再重新调用 update_health_profile',
  buildPending: async (userId, args) => {
    const memberId = args?.memberId;
    if (!validate.isIdValid(memberId)) {
      return { ok: false, message: 'memberId无效' };
    }

    const profiles = await HealthProfile.findByUser(userId);
    const profile = profiles.find((p) => Number(p.memberId) === Number(memberId));
    if (!profile) {
      return { ok: false, message: '该家庭成员的健康档案不存在或无权操作' };
    }

    const bloodType =
      args?.bloodType === undefined
        ? profile.bloodType
        : String(args.bloodType || '').trim() || null;
    const allergies =
      args?.allergies === undefined ? profile.allergies : normalizeArr(args.allergies);
    const chronicConditions =
      args?.chronicConditions === undefined
        ? profile.chronicConditions
        : normalizeArr(args.chronicConditions);
    const contraindications =
      args?.contraindications === undefined
        ? profile.contraindications
        : normalizeArr(args.contraindications);
    const medicalNotes =
      args?.medicalNotes === undefined
        ? profile.medicalNotes
        : String(args.medicalNotes || '').trim() || null;

    if (!validate.isBloodTypeValidIfPresent(bloodType)) {
      return { ok: false, message: '血型无效，只能是A型/B型/AB型/O型' };
    }
    if (!validate.isStringArrayValid(allergies, { maxItems: 20, maxLen: 50 })) {
      return {
        ok: false,
        message: '过敏史格式无效，必须是字符串数组，不超过20项，单项不超过50字符'
      };
    }
    if (!validate.isStringArrayValid(chronicConditions, { maxItems: 20, maxLen: 50 })) {
      return {
        ok: false,
        message: '慢性病格式无效，必须是字符串数组，不超过20项，单项不超过50字符'
      };
    }
    if (!validate.isStringArrayValid(contraindications, { maxItems: 20, maxLen: 50 })) {
      return {
        ok: false,
        message: '用药禁忌格式无效，必须是字符串数组，不超过20项，单项不超过50字符'
      };
    }
    if (!validate.isMedicalNotesValidIfPresent(medicalNotes)) {
      return { ok: false, message: '备注格式无效，不超过1000字符' };
    }

    return {
      ok: true,
      pendingAction: {
        type: 'update_health_profile',
        summary: `更新家庭成员${profile.name}的健康档案`,
        fields: [
          { label: '成员', value: profile.name },
          { label: '血型', value: bloodType || '未知' },
          { label: '过敏史', value: formatArr(allergies) },
          { label: '慢性病', value: formatArr(chronicConditions) },
          { label: '用药禁忌', value: formatArr(contraindications) },
          { label: '备注', value: medicalNotes || '无' }
        ],
        payload: {
          memberId: Number(memberId),
          bloodType: bloodType || null,
          allergies,
          chronicConditions,
          contraindications,
          medicalNotes: medicalNotes || null
        },
        resultText: {
          done: '已更新健康档案，可在「健康档案」页面查看',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const { memberId, bloodType, allergies, chronicConditions, contraindications, medicalNotes } =
      payload || {};
    const updated = await HealthProfile.update(memberId, userId, {
      blood_type: bloodType ? String(bloodType).trim() : null,
      allergies,
      chronic_conditions: chronicConditions,
      contraindications,
      medical_notes: medicalNotes ? String(medicalNotes).trim() : null
    });
    if (!updated) {
      return { ok: false, message: '更新健康档案失败' };
    }
    return {
      ok: true,
      message: '已更新健康档案',
      data: null
    };
  }
};

module.exports = [listHealthProfiles, updateHealthProfile];
