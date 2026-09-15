import request from './request'

export const confirmAction = (pendingAction) =>
  request.post('/ai/confirm', { pendingAction }, { timeout: 30000 })

export const chatWithAiStream = async (messages, handlers = {}) => {
  const { onDelta, onDone, onPending, onStatus, onError } = handlers

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
    throw new Error(message)
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
