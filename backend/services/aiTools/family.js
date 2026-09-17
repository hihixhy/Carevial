const FamilyMember = require('../../models/FamilyMember');
const validate = require('../../utils/validate');

const listFamilyMembers = {
  name: 'list_family_members',
  kind: 'read',
  definition: {
    type: 'function',
    function: {
      name: 'list_family_members',
      description:
        '查询当前登录用户的家庭成员列表，用于把「爸爸/妈妈」等关系/称呼解析成 memberId；创建药品归属成员前可先调本工具',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  run: async (userId) => {
    const list = await FamilyMember.findByUser(userId);
    return list.map((m) => ({
      id: m.id,
      name: m.name,
      age: m.age,
      relationship: m.relationship
    }));
  }
};

const createFamilyMember = {
  name: 'create_family_member',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'create_family_member',
      description:
        '添加家庭成员（姓名、关系必填；年龄可选）。直接调用本工具，由系统确认卡执行；不要口头二次确认，不要声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '姓名，不超过50字符' },
          age: { type: 'integer', description: '年龄，0-120的整数，不传表示未填' },
          relationship: { type: 'string', description: '关系，如爸爸/妈妈，不超过50字符' }
        },
        required: ['name', 'relationship']
      }
    }
  },
  failHint: '请核对姓名与关系后再调用 create_family_member',
  buildPending: async (userId, args) => {
    const name = String(args?.name || '').trim();
    const age = args?.age;
    const relationship = String(args?.relationship || '').trim();

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
      pendingAction: {
        type: 'create_family_member',
        summary: `创建家庭成员：${name}（${relationship}）`,
        fields: [
          { label: '姓名', value: name },
          { label: '年龄', value: validate.isNotEmpty(age) ? String(Number(age)) : '未填' },
          { label: '关系', value: relationship }
        ],
        payload: {
          name,
          age: validate.isNotEmpty(age) ? Number(age) : null,
          relationship
        },
        resultText: {
          done: '已创建家庭成员，可在「家庭成员」页面查看',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const { name, age, relationship } = payload || {};

    const memberId = await FamilyMember.create({
      user_id: userId,
      name,
      age: age == null ? null : Number(age),
      relationship
    });
    return {
      ok: true,
      message: '已创建家庭成员',
      data: {
        id: memberId
      }
    };
  }
};

const updateFamilyMember = {
  name: 'update_family_member',
  kind: 'write',
  definition: {
    type: 'function',
    function: {
      name: 'update_family_member',
      description:
        '更新家庭成员（姓名/年龄/关系）。须先 list_family_members 拿到真实 memberId。未传字段保持原值。直接调用本工具，由系统确认卡执行；不要口头二次确认，不要声称已成功。',
      parameters: {
        type: 'object',
        properties: {
          memberId: { type: 'integer', description: '家庭成员ID（须为真实ID）' },
          name: { type: 'string', description: '姓名，不超过50字符' },
          age: {
            type: 'integer',
            description: '年龄，0-120的整数；不传保持原值；要清空请传空或 null'
          },
          relationship: { type: 'string', description: '关系，如爸爸/妈妈，不超过50字符' }
        },
        required: ['memberId']
      }
    }
  },
  failHint: '请先调用 list_family_members 核对 memberId，再重新调用 update_family_member',
  buildPending: async (userId, args) => {
    const memberId = args?.memberId;
    if (!validate.isIdValid(memberId)) {
      return { ok: false, message: 'memberId无效' };
    }

    const member = await FamilyMember.findById(memberId, userId);
    if (!member) {
      return { ok: false, message: '家庭成员不存在或无权操作' };
    }

    const name = validate.isNotEmpty(args?.name) ? String(args.name).trim() : member.name;
    const age =
      args?.age === undefined
        ? member.age
        : validate.isNotEmpty(args?.age)
          ? Number(args.age)
          : null;
    const relationship = validate.isNotEmpty(args?.relationship)
      ? String(args.relationship).trim()
      : member.relationship;

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
      pendingAction: {
        type: 'update_family_member',
        summary: `更新家庭成员：${name}（${relationship}）`,
        fields: [
          { label: '姓名', value: name },
          { label: '年龄', value: validate.isNotEmpty(age) ? String(Number(age)) : '未填' },
          { label: '关系', value: relationship }
        ],
        payload: {
          memberId: Number(memberId),
          name,
          age: validate.isNotEmpty(age) ? Number(age) : null,
          relationship
        },
        resultText: {
          done: '已更新家庭成员，可在「家庭成员」页面查看',
          cancelled: '已取消，未执行任何操作'
        }
      }
    };
  },
  execute: async (userId, payload) => {
    const { memberId, name, age, relationship } = payload || {};

    const updated = await FamilyMember.update(memberId, userId, {
      name,
      age: validate.isNotEmpty(age) ? Number(age) : null,
      relationship
    });
    if (!updated) {
      return { ok: false, message: '更新家庭成员失败' };
    }

    return {
      ok: true,
      message: '已更新家庭成员',
      data: null
    };
  }
};

module.exports = [listFamilyMembers, createFamilyMember, updateFamilyMember];
