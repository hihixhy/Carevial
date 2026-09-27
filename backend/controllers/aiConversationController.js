const AIConversation = require('../models/AIConversation');
const AIMessage = require('../models/AIMessage');
const validate = require('../utils/validate');
const deepseek = require('../services/deepseek');

const TITLE_SYSTEM_PROMPT = `你是会话标题助手。根据用户与助手的第一轮对话，生成一个简短中文标题。
要求：
- 只输出标题本身，不要引号、不要句号、不要解释
- 不超过20个字
- 概括用户意图，例如「设置降压药提醒」「查询药品过期」`;

const ALLOWED_ROLES = new Set(['user', 'assistant']);

// 校验标题
const parseTitle = (raw) => {
  // 多个空格替换为一个空格
  const title = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!title) return { ok: false, message: '标题不能为空' };
  if (title.length > 20) return { ok: false, message: '标题不能超过20个字符' };
  return { ok: true, title };
};

// 给前端的对话对象
const toPublicConversation = (conv) => {
  if (!conv) return null;
  return {
    publicId: conv.publicId,
    title: conv.title,
    updatedAt: conv.updatedAt,
    createdAt: conv.createdAt
  };
};

// 获取对话列表
exports.getConversations = async (req, res) => {
  try {
    const list = await AIConversation.findByUser(req.userId);
    return res.status(200).json({
      code: 200,
      message: '获取对话列表成功',
      data: list.map(toPublicConversation)
    });
  } catch (err) {
    console.error('获取对话列表失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

// 获取对话详情
exports.getConversation = async (req, res) => {
  const publicId = req.params?.publicId;
  if (!validate.isPublicIdValid(publicId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的对话ID',
      data: null
    });
  }

  try {
    const conv = await AIConversation.findByPublicId(publicId, req.userId);
    if (!conv) {
      return res.status(404).json({
        code: 404,
        message: '对话不存在或无权限访问',
        data: null
      });
    }
    const messages = await AIMessage.findByConversationId(conv.id);
    return res.status(200).json({
      code: 200,
      message: '获取对话详情成功',
      data: {
        conversation: toPublicConversation(conv),
        messages
      }
    });
  } catch (err) {
    console.error('获取对话详情失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

// 创建对话
exports.createConversation = async (req, res) => {
  const firstUserMessage = String(req.body?.firstUserMessage || '').trim();
  if (!firstUserMessage) {
    return res.status(400).json({
      code: 400,
      message: '首条消息不能为空',
      data: null
    });
  }
  if (firstUserMessage.length > 2000) {
    return res.status(400).json({
      code: 400,
      message: '单条消息不能超过2000个字符',
      data: null
    });
  }

  try {
    const conv = await AIConversation.createWithFirstMessage({
      userId: req.userId,
      title: '新对话',
      firstUserMessage
    });
    if (!conv) {
      return res.status(500).json({
        code: 500,
        message: '创建对话失败',
        data: null
      });
    }

    return res.status(200).json({
      code: 200,
      message: '创建对话成功',
      data: toPublicConversation(conv)
    });
  } catch (err) {
    console.error('创建对话失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.renameConversation = async (req, res) => {
  const publicId = req.params?.publicId;
  if (!validate.isPublicIdValid(publicId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的对话ID',
      data: null
    });
  }
  const parsed = parseTitle(req.body?.title);
  if (!parsed.ok) {
    return res.status(400).json({
      code: 400,
      message: parsed.message,
      data: null
    });
  }

  try {
    const updated = await AIConversation.updateTitle(publicId, req.userId, parsed.title);
    if (!updated) {
      return res.status(404).json({
        code: 404,
        message: '对话不存在或无权限访问',
        data: null
      });
    }

    const conv = await AIConversation.findByPublicId(publicId, req.userId);
    return res.status(200).json({
      code: 200,
      message: '编辑对话名称成功',
      data: toPublicConversation(conv)
    });
  } catch (err) {
    console.error('编辑对话名称失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.deleteConversation = async (req, res) => {
  const publicId = req.params?.publicId;
  if (!validate.isPublicIdValid(publicId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的对话ID',
      data: null
    });
  }

  try {
    const deleted = await AIConversation.delete(publicId, req.userId);
    if (!deleted) {
      return res.status(404).json({
        code: 404,
        message: '对话不存在或无权限访问',
        data: null
      });
    }
    return res.status(200).json({
      code: 200,
      message: '删除对话成功',
      data: null
    });
  } catch (err) {
    console.error('删除对话失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

// 添加消息
exports.appendMessage = async (req, res) => {
  const { role, content, pendingAction, actionStatus } = req.body;
  const text = String(content ?? '').trim();
  const publicId = req.params?.publicId;
  if (!validate.isPublicIdValid(publicId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的对话ID',
      data: null
    });
  }
  if (!ALLOWED_ROLES.has(role)) {
    return res.status(400).json({
      code: 400,
      message: '无效的role',
      data: null
    });
  }
  if (!text) {
    return res.status(400).json({
      code: 400,
      message: '消息内容不能为空',
      data: null
    });
  }
  if (text.length > 2000) {
    return res.status(400).json({
      code: 400,
      message: '单条消息不能超过2000个字符',
      data: null
    });
  }
  if (!validate.isActionStatusValidIfPresent(actionStatus)) {
    return res.status(400).json({
      code: 400,
      message: '无效的action_status',
      data: null
    });
  }

  try {
    const conv = await AIConversation.findByPublicId(publicId, req.userId);
    if (!conv) {
      return res.status(404).json({
        code: 404,
        message: '对话不存在或无权限访问',
        data: null
      });
    }

    const created = await AIMessage.create({
      conversationId: conv.id,
      role,
      content: text,
      pendingAction,
      actionStatus
    });

    try {
      await AIConversation.touchUpdatedAt(conv.id);
    } catch (err) {
      console.error('刷新对话更新时间失败：', err);
      // 继续执行，不返回错误
    }

    return res.status(200).json({
      code: 200,
      message: '消息添加成功',
      data: {
        id: created.id,
        role,
        content: text,
        pendingAction: pendingAction ?? null,
        actionStatus: actionStatus ?? null,
        createdAt: created.createdAt
      }
    });
  } catch (err) {
    console.error('消息添加失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.updateMessageActionStatus = async (req, res) => {
  const publicId = req.params?.publicId;
  const messageId = req.params?.messageId;
  const status = String(req.body?.actionStatus ?? '').trim();

  if (!validate.isPublicIdValid(publicId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的对话ID',
      data: null
    });
  }
  if (!validate.isIdValid(messageId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的消息ID',
      data: null
    });
  }
  if (!['done', 'cancelled'].includes(status)) {
    return res.status(400).json({
      code: 400,
      message: '无效的action_status',
      data: null
    });
  }

  try {
    const conv = await AIConversation.findByPublicId(publicId, req.userId);
    if (!conv) {
      return res.status(404).json({
        code: 404,
        message: '对话不存在或无权限访问',
        data: null
      });
    }

    const updated = await AIMessage.updateActionStatus(messageId, conv.id, status);
    if (!updated) {
      return res.status(404).json({
        code: 404,
        message: '消息不存在或无权限访问',
        data: null
      });
    }

    return res.status(200).json({
      code: 200,
      message: '确认卡状态更新成功',
      data: {
        id: Number(messageId),
        actionStatus: status
      }
    });
  } catch (err) {
    console.error('更新确认卡状态失败', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};

exports.generateTitle = async (req, res) => {
  const publicId = req.params?.publicId;
  if (!validate.isPublicIdValid(publicId)) {
    return res.status(400).json({
      code: 400,
      message: '无效的对话ID',
      data: null
    });
  }

  try {
    const conv = await AIConversation.findByPublicId(publicId, req.userId);
    if (!conv) {
      return res.status(404).json({
        code: 404,
        message: '对话不存在或无权限访问',
        data: null
      });
    }

    // 已经不是默认标题，返回
    if (conv.title && conv.title !== '新对话') {
      return res.status(200).json({
        code: 200,
        message: '标题已存在',
        data: toPublicConversation(conv)
      });
    }

    const messages = await AIMessage.findByConversationId(conv.id);
    const firstUser = messages.find((m) => m.role === 'user' && String(m.content || '').trim());
    const firstAssistant = messages.find(
      (m) => m.role === 'assistant' && String(m.content || '').trim()
    );

    if (!firstUser || !firstAssistant) {
      return res.status(400).json({
        code: 400,
        message: '需要至少一轮完整对话才能生成标题',
        data: null
      });
    }

    // 把给模型的内容截短
    const clip = (s, n = 300) => {
      const t = String(s).trim();
      return t.length > n ? t.slice(0, n) : t;
    };

    let rawTitle = '';
    try {
      rawTitle = await deepseek.chat(
        [
          { role: 'user', content: clip(firstUser.content) },
          { role: 'assistant', content: clip(firstAssistant.content) },
          { role: 'user', content: '请为以上对话生成标题' }
        ],
        { systemPrompt: TITLE_SYSTEM_PROMPT, maxTokens: 64 }
      );
    } catch (err) {
      console.error('生成标题调用模型失败：', err);
      return res.status(502).json({
        code: 502,
        message: '生成标题失败，请稍后再试',
        data: null
      });
    }

    // 去掉引号、包裹类符号、空白
    let title = String(rawTitle || '')
      .replace(/^["「『]|["」』]$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (title.length > 20) title = title.slice(0, 20);

    const parsed = parseTitle(title);
    if (!parsed.ok) {
      title = '新对话';
    } else {
      title = parsed.title;
    }

    // 如果最终还是新对话，不写库
    if (title === '新对话') {
      return res.status(200).json({
        code: 200,
        message: '标题生成跳过',
        data: toPublicConversation(conv)
      });
    }

    const ok = await AIConversation.updateTitle(publicId, req.userId, title);
    if (!ok) {
      return res.status(400).json({
        code: 400,
        message: '对话不存在或无权限访问',
        data: null
      });
    }

    const updated = await AIConversation.findByPublicId(publicId, req.userId);
    return res.status(200).json({
      code: 200,
      message: '标题生成成功',
      data: toPublicConversation(updated)
    });
  } catch (err) {
    console.error('生成标题失败：', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
      data: null
    });
  }
};
