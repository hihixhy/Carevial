const deepseek = require('../services/deepseek');
const { dayjs } = require('../utils/date');
const {
  TOOL_DEFINITIONS,
  isWriteTool,
  runReadTool,
  buildPending,
  executeConfirmedAction,
  getFailHint
} = require('../services/aiTools');

const ALLOWED_ROLES = new Set(['user', 'assistant']);
// 工具调用轮次上限
const MAX_TOOL_ROUNDS = 3;

// 解析消息数组
const parseMessages = (body) => {
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, message: 'messages必须是非空数组' };
  }
  if (messages.length > 20) {
    return { ok: false, message: 'messages过多，请减少历史轮次' };
  }

  const normalized = [];
  for (const item of messages) {
    const role = item?.role;
    const content = typeof item?.content === 'string' ? item.content.trim() : '';
    if (!ALLOWED_ROLES.has(role) || !content) {
      return { ok: false, message: '每条message需要有效的role与content' };
    }
    if (content.length > 2000) {
      return { ok: false, message: '单条消息过长' };
    }
    normalized.push({ role, content });
  }

  if (normalized[normalized.length - 1].role !== 'user') {
    return { ok: false, message: '最后一条消息必须是user' };
  }

  return { ok: true, data: normalized };
};

// 解析call.function.arguments的值，原本是一个json字符串
const parseToolArgs = (raw) => {
  if (raw == null || raw === '') return {};
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
};

// 给模型今天的星期，方便算明天
const buildTimeHintMessage = () => {
  const now = dayjs();
  const weekday = now.day(); // 0=周日 … 6=周六
  const tomorrow = (weekday + 1) % 7;
  return {
    role: 'user',
    content: `【系统时间】今天是 ${now.format('YYYY-MM-DD')}，weekday=${weekday}（0=周日…6=周六）。若用户说「明天」，days 应使用 ${tomorrow}。此消息仅供计算日期，不要向用户复述。`
  };
};

exports.chatStream = async (req, res) => {
  const parsed = parseMessages(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      code: 400,
      message: parsed.message,
      data: null
    });
  }

  // SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  // 往输出流写入文本
  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  // 客户端断开标记
  let closed = false;
  res.on('close', () => {
    if (!res.writableEnded) closed = true;
  });

  try {
    // 系统时间提示放最前面
    const messages = [buildTimeHintMessage(), ...parsed.data];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      if (closed) return;

      const message = await deepseek.chatStream(messages, {
        tools: TOOL_DEFINITIONS,
        onDelta: (text) => {
          if (closed) return;
          send({ type: 'delta', text });
        }
      });

      const toolCalls = message.tool_calls;

      // 如果没有工具调用 -> 本轮已流式推完正文
      if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        if (!closed) {
          if (!message.content) {
            send({ type: 'delta', text: '暂时没有更多内容可以回复。' });
          }
          send({ type: 'done', pendingAction: null });
          res.end();
        }
        return;
      }

      messages.push({
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: toolCalls
      });

      for (const call of toolCalls) {
        if (closed) return;

        const name = call?.function?.name;
        const callId = call?.id;
        const args = parseToolArgs(call?.function?.arguments);

        if (!name || !callId) {
          send({ type: 'error', message: '模型返回的工具调用格式无效' });
          res.end();
          return;
        }
        if (args === null) {
          send({ type: 'error', message: '模型返回的工具参数不是合法JSON' });
          res.end();
          return;
        }

        // 写操作,变成待确认，不写入数据库
        if (isWriteTool(name)) {
          const built = await buildPending(req.userId, name, args);
          if (!built.ok) {
            // 不中断，告诉模型这次工具失败了
            messages.push({
              role: 'tool',
              tool_call_id: callId,
              content: JSON.stringify({
                ok: false,
                error: built.message,
                hint: getFailHint(name)
              })
            });
            continue;
          }

          send({
            type: 'pending',
            reply: `准备执行：${built.pendingAction.summary}。请确认或取消。`,
            pendingAction: built.pendingAction
          });
          res.end();
          return;
        }

        // 读操作
        if (!closed) {
          send({ type: 'status', message: '工具执行中...' });
        }

        let result;
        try {
          result = await runReadTool(req.userId, name, args);
        } catch (toolErr) {
          result = { error: toolErr.message || '工具执行失败' };
        }

        messages.push({
          role: 'tool',
          tool_call_id: callId,
          content: JSON.stringify(result)
        });
      }
      // 进入下一轮,可能再流式说话，或者调工具
    }

    if (!closed) {
      send({
        type: 'delta',
        text: '工具调用轮次过多，请把需求说得更具体一些后再试'
      });
      send({ type: 'done', pendingAction: null });
      res.end();
    }
  } catch (err) {
    console.error('AI流式对话失败：', err);
    if (!closed && !res.writableEnded) {
      send({
        type: 'error',
        message: err.message || '服务器错误，请稍后再试'
      });
      res.end();
    }
  }
};

exports.confirm = async (req, res) => {
  const pendingAction = req.body?.pendingAction;
  const name = pendingAction?.type;

  if (!pendingAction || typeof pendingAction !== 'object') {
    return res.status(400).json({
      code: 400,
      message: '缺少正确的pendingAction',
      data: null
    });
  }
  if (!isWriteTool(name)) {
    return res.status(400).json({
      code: 400,
      message: '不支持的操作类型',
      data: null
    });
  }
  if (!pendingAction.payload || typeof pendingAction.payload !== 'object') {
    return res.status(400).json({
      code: 400,
      message: 'pendingAction.payload无效',
      data: null
    });
  }

  // 再校验一次payload，防止前端篡改
  const rebuilt = await buildPending(req.userId, name, pendingAction.payload);
  if (!rebuilt.ok) {
    return res.status(400).json({
      code: 400,
      message: rebuilt.message,
      data: null
    });
  }

  try {
    const result = await executeConfirmedAction(req.userId, rebuilt.pendingAction);
    if (!result.ok) {
      return res.status(400).json({
        code: 400,
        message: result.message,
        data: null
      });
    }

    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    console.error('AI确认执行失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};
