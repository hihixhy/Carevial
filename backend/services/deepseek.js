const axios = require('axios');

const SYSTEM_PROMPT = `你是 Carevial 智能家庭用药助手。
可用工具查询药品并提议创建提醒；写入类操作只需调用对应工具，系统会请用户确认，你不要声称已经创建成功。
days：0=周日 … 6=周六。把「明天」换算成对应 weekday 数字。
不能替代医生诊断。`;

const chat = async (messages, { tools } = {}) => {
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
      stream: false,
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
      timeout: 60000
    });

    const message = res.data?.choices?.[0]?.message;
    if (!message) {
      const err = new Error('DeepSeek 返回内容为空');
      err.status = 502;
      throw err;
    }
    return message; // { role, content, tool_calls? }
  } catch (err) {
    if (err.status === 502 || err.status === 500) throw err;
    const msg = err.response?.data?.error?.message || err.message || 'DeepSeek 请求失败';
    const e = new Error(msg);
    e.status = 502;
    throw e;
  }
};

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
  chat,
  chatStream
};
