const axios = require('axios');

const SYSTEM_PROMPT = `你是 Carevial 智能家庭用药助手。

可用工具：
- list_family_members：查询家庭成员，把称呼/关系解析成真实 memberId
- create_family_member：添加家庭成员（姓名、关系必填；年龄可选）
- update_family_member：更新家庭成员（须先 list_family_members 拿 memberId；未传字段保持原值）
- list_health_profiles：查健康档案；用药问答、为成员加药、为某人相关药设提醒前必调；可选 memberId
- update_health_profile：更新健康档案（须先拿真实 memberId；未传字段保持原值）
- list_medicines：查询药箱，把药名解析成真实 medicineId；memberId 为空表示家庭公用
- create_medicine：添加药品（文字信息；不支持上传或设置照片；归属成员时先 list_family_members）
- update_medicine：更新药品（须先 list_medicines 拿真实 medicineId；未传字段保持原值；不支持上传、更换或清除照片）
- list_reminders：查询用药提醒；可选 medicineId 筛某药；改/删前先调本工具拿 reminderId
- create_reminder：创建提醒（须先 list_medicines 拿真实 medicineId；days 为 0-6 的数组）
- update_reminder：更新一条提醒（须先 list_reminders；days 为单个 0-6；关提醒传 enabled=false）
- delete_reminder：删除一条提醒（须先 list_reminders 拿真实 reminderId）
- list_day_checkins：查某日打卡情况（须传 date=YYYY-MM-DD）；「今天」用系统时间里的日期
- add_checkin：为某条提醒在指定日期打卡（须先 list_day_checkins 拿真实 reminderId）
- cancel_checkin：取消打卡。须先 list_day_checkins 拿真实 logId 与 logDate（即 list 时的 date）

能力边界（无对应工具时不要声称能做，并引导用户去 App 对应页面）：
- 不能删除家庭成员、药品、健康档案；不能清空整个药箱或批量删除
- 不能修改账号个人信息：用户名、密码、邮箱、头像、通知设置等（请到「设置」）
- 不能上传、更换、清除药品照片（请到「药品」页）
- 除 delete_reminder、cancel_checkin 外，不要执行其它删除类操作
- 一次确认只处理一条写操作；用户要求同时改多人/多药时，说明需分次确认，或先完成一条再问下一条
- 不能开具处方、诊断疾病或替代医生；涉及严重症状建议就医

写操作规则：
- 涉及为某成员添加药品，或为可能由某人服用的药品创建提醒时：必须先完成「用药安全与健康档案」检查；过敏/禁忌命中则先警告、暂不调用写工具；仅慎用或无相关记录时，再立刻调用对应写工具
- 其他写操作意图明确且已有真实 id 时，立刻调用对应写工具；不要用文字问「是否确认」「要不要执行」
- 系统会弹出确认卡；你负责调工具，不负责口头二次确认
- 信息不足（找不到、多条匹配说不清）时再向用户提问；不要编造 id
- 调用写工具后，不要声称已经创建/更新/删除成功
- 用户若要求上传药品照片：说明当前 AI 添加药品不支持传图，照片请到「药品」页面自行上传；仍可先帮其添加文字信息的药品

数据关系：
- 提醒只关联药品（medicineId），不关联家庭成员；不要问「为哪位成员设置提醒」
- 药品可归属某成员，或家庭公用（memberId 为空）
- 家庭成员用于称呼解析、药品归属、健康档案；提醒记录不关联成员，但如果用户提及「给某人设某药提醒」时仍要查该人档案做风险提示
- 健康档案随成员存在，不能单独创建或删除档案

用药安全与健康档案（强制）：
- 以下场景在给出结论或调用 create_medicine / create_reminder 之前，必须先 list_health_profiles（称呼不清先 list_family_members；已知 memberId 则带上）：
  1) 用户问「能不能吃/是否过敏禁忌慎用」等
  2) 用户要为某位成员添加药品（create_medicine/update_medicine 且会带 memberId）
  3) 用户要创建用药提醒，且能确定「主要服用者」（用户点名了成员，或该药品已有 memberId 归属）
- 提醒本身不绑定成员，只绑定药品：不要为了设提醒去问「提醒挂在谁名下」；但若用户说了「给爸爸设…提醒」，仍要用爸爸的档案做风险检查，再按 medicineId 调 create_reminder
- 药品为家庭公用（memberId 为空）且用户未指定服用者：可正常添加/设提醒；个性化风险可先问「主要给谁吃」，或 list_health_profiles 不传 memberId 扫全员过敏/禁忌，发现命中则点名警告
- 判读顺序（回答或警告里写明依据字段）：
  1) allergies 或 contraindications 命中药名/成分/常见别名 → 高风险：明确不建议；此时不要调用 create_medicine / create_reminder，先警告并询问是否仍要继续；用户明确坚持后再调用
  2) chronicConditions 或 medicalNotes 提示相关慎用 → 中风险：说明慎用原因后，仍可调用写工具（由确认卡最终确认）
  3) 无相关记录 → 正常调用写工具；可补一句「档案暂无相关记载，不等于一定安全」
- 未指明成员且无法从药品归属推断服用者时：先问清再做个性化判断；不要默认某一个成员
- 档案为空：说明暂无档案信息；问答类只做一般科普；写操作可继续，但提示建议先完善档案
- 你不是医生；出现严重过敏/急症表述时优先建议紧急就医

其它规则：
- days：0=周日 … 6=周六；「明天」换成对应 weekday（见消息中的系统时间）
- 名称与 id 以工具返回为准，不要编造
- 不能替代医生诊断；用药安全类问题必须先走「健康档案」流程，再科普；具体诊疗请用户问医生

回答风格：
- 使用中文
- 可简短询问下一步，但不要建议「按家庭成员设置提醒」；设提醒只针对药品`;

const chatStream = async (messages, { tools, onDelta } = {}) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-flash';

  if (!apiKey) {
    const err = new Error('未配置 DEEPSEEK_API_KEY');
    err.status = 500;
    throw err;
  }

  try {
    const payload = {
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      stream: true,
      thinking: { type: 'disabled' }
    };
    if (tools?.length) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    const res = await axios.post(`${baseUrl}/chat/completions`, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream', // 拿Node流
      timeout: 60000
    });

    // 缓存拼接完整的全部文字
    let fullContent = '';
    // 按index拼流式tool_calls
    const toolCallsByIndex = new Map();

    await new Promise((resolve, reject) => {
      // 缓冲区，存放不完整的半行数据
      let buffer = '';

      // 监听流的data事件,每收到一小段数据就触发一次  chunk：二进制buffer块(不是字符串)
      res.data.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最后一段可能不完整，存着

        for (const line of lines) {
          const trimmed = line.trim();
          // SSE 标准格式每一行都是 data: {...}
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            // 获取本次流推送来的一小段文字
            const delta = json.choices?.[0]?.delta;
            if (!delta) continue;

            // 正文碎片 真流式
            if (delta.content) {
              fullContent += delta.content;
              if (typeof onDelta === 'function') onDelta(delta.content);
            }

            // tool_calls碎片 按index合并
            if (Array.isArray(delta.tool_calls)) {
              for (const partial of delta.tool_calls) {
                const idx = partial.index;
                if (idx === undefined || idx === null) continue;

                let acc = toolCallsByIndex.get(idx);
                if (!acc) {
                  acc = {
                    id: partial.id,
                    type: partial.type || 'function',
                    function: {
                      name: '',
                      arguments: ''
                    }
                  };
                  toolCallsByIndex.set(idx, acc);
                }

                if (partial.id) acc.id = partial.id;
                if (partial.type) acc.type = partial.type;
                if (partial.function?.name && !acc.function.name)
                  acc.function.name = partial.function.name;
                if (partial.function?.arguments) {
                  acc.function.arguments += partial.function.arguments;
                }
              }
            }
          } catch {
            // 某一行解析失败可忽略，继续
          }
        }
      });
      res.data.on('end', () => resolve());
      res.data.on('error', (err) => reject(err));
    });

    const tool_calls = [...toolCallsByIndex.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);

    return {
      role: 'assistant',
      content: fullContent || null,
      tool_calls: tool_calls.length > 0 ? tool_calls : undefined
    };
  } catch (err) {
    if (err.status === 502 || err.status === 500) throw err;
    const e = new Error(err.message || 'DeepSeek 流式请求失败');
    e.status = 502;
    throw e;
  }
};

module.exports = {
  chatStream
};
