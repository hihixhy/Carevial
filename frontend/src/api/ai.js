import request from './request'

// 获取对话列表
export const getConversations = () => request.get('/ai/conversations')
// 创建对话
export const createConversation = (body) => request.post('/ai/conversations', body)
// 获取对话详情
export const getConversation = (publicId) => request.get(`/ai/conversations/${publicId}`)
// 重命名对话标题
export const renameConversation = (publicId, title) =>
  request.patch(`/ai/conversations/${publicId}`, { title })
// 删除对话
export const deleteConversation = (publicId) => request.delete(`/ai/conversations/${publicId}`)
// 添加消息
export const appendMessage = (publicId, body) =>
  request.post(`/ai/conversations/${publicId}/messages`, body)
// 更新消息确认卡状态
export const updateMessageActionStatus = (publicId, messageId, actionStatus) =>
  request.patch(`/ai/conversations/${publicId}/messages/${messageId}`, { actionStatus })
// 生成对话标题
export const generateConversationTitle = (publicId) =>
  request.patch(`/ai/conversations/${publicId}/generate-title`, null, { timeout: 30000 })

// 确认写操作
export const confirmAction = (pendingAction) =>
  request.post('/ai/confirm', { pendingAction }, { timeout: 30000 })

// 与AI对话（流式）
export const chatWithAiStream = async (messages, handlers = {}) => {
  const { onDelta, onDone, onPending, onStatus, onClearContent, onError } = handlers

  const res = await fetch('/api/ai/chat-stream', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  })

  // 非SSE的错误，后端可能仍返回JSON
  if (!res.ok) {
    let message = `请求失败（${res.status}）`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      // 忽略
    }
    const err = new Error(message)
    if (typeof onError === 'function') onError(err)
    throw err
  }

  if (!res.body) {
    throw new Error('浏览器不支持流式读取')
  }

  // 流读取器，一段段读取后端传来的二进制数据
  const reader = res.body.getReader()
  // 解码器，把二进制字节转成utf-8字符串
  const decoder = new TextDecoder('utf-8')
  // 缓冲区，存放不完整的半行数据
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() || ''

      for (const chunk of chunks) {
        const line = chunk.trim()
        if (!line.startsWith('data:')) continue

        let payload
        try {
          payload = JSON.parse(line.slice(5).trim())
        } catch {
          continue
        }

        // 如果类型是文本片段，就调用onDelta回调，传给前端
        if (payload.type === 'delta' && typeof onDelta === 'function') {
          onDelta(payload.text || '')
        } else if (payload.type === 'status' && typeof onStatus === 'function') {
          onStatus(payload.message || '')
        } else if (payload.type === 'content_reset' && typeof onClearContent === 'function') {
          onClearContent()
        } else if (payload.type === 'pending' && typeof onPending === 'function') {
          onPending({
            reply: payload.reply || '',
            pendingAction: payload.pendingAction || null
          })
        } else if (payload.type === 'done' && typeof onDone === 'function') {
          onDone({ pendingAction: payload.pendingAction ?? null })
        } else if (payload.type === 'error') {
          throw new Error(payload.message || 'AI流式失败')
        }
      }
    }
  } catch (err) {
    if (typeof onError === 'function') onError(err)
    throw err
  }
}
