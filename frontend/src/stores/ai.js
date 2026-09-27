import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { formatMessageTime } from '../utils/date'
import {
  getConversations,
  createConversation as createConversationApi,
  getConversation,
  renameConversation as renameConversationApi,
  deleteConversation as deleteConversationApi,
  appendMessage as appendMessageApi,
  updateMessageActionStatus as updateMessageActionStatusApi,
  generateConversationTitle as generateConversationTitleApi,
  chatWithAiStream
} from '../api/ai'

export const AI_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    '你好！我是 Carevial 的 AI 助手。你可以直接告诉我你想做什么，或者你想了解什么，比如：\n\n• "帮我给爸爸设置每天早上8点吃降压药"\n• "阿莫西林和头孢有什么区别"\n\n我会帮你快速完成操作！',
  timestamp: formatMessageTime(new Date())
}

const mapConversations = (c) => {
  return {
    id: c.publicId,
    title: c.title,
    updatedAt: c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now(),
    messages: []
  }
}

const mapMessage = (m) => {
  return {
    id: String(m.id),
    role: m.role,
    content: m.content,
    pendingAction: m.pendingAction ?? null,
    actionStatus: m.actionStatus ?? null,
    timestamp: formatMessageTime(m.createdAt),
    persisted: true
  }
}

export const useAiStore = defineStore('ai', () => {
  // 对话列表
  const conversations = ref([])
  // { [publicId]: Message[] }
  const messagesById = ref({})
  // 草稿消息列表
  const draftMessages = ref([{ ...AI_WELCOME_MESSAGE }])
  const typingById = ref({})
  const activeId = ref(null)
  const listLoaded = ref(false)

  // 当前会话的消息列表
  const currentMessages = computed(() => {
    if (!activeId.value) return draftMessages.value
    return messagesById.value[activeId.value] || [{ ...AI_WELCOME_MESSAGE }]
  })

  const sortedConversations = computed(() =>
    [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt)
  )

  const isDraft = computed(() => !activeId.value)

  const isTyping = computed(() => {
    if (!activeId.value) return false
    return !!typingById.value[activeId.value]
  })

  const loadConversations = async () => {
    const res = await getConversations()
    conversations.value = (res.data || []).map(mapConversations)
    listLoaded.value = true
  }

  // 在新对话还没发消息时，先进入草稿状态
  const enterDraft = () => {
    activeId.value = null
    draftMessages.value = [{ ...AI_WELCOME_MESSAGE }]
  }

  const selectConversation = (publicId) => {
    if (!conversations.value.find((c) => c.id === publicId)) return false
    activeId.value = publicId
    return true
  }

  // 从其它入口进 AI：有会话 → 最新一条；否则草稿
  const resolveAiEntry = async () => {
    // 列表还没加载时，先加载
    if (!listLoaded.value) await loadConversations()

    const first = sortedConversations.value[0]
    if (first) {
      selectConversation(first.id)
      return {
        name: 'ai-conversation',
        params: { conversationId: first.id }
      }
    }
    enterDraft()
    return { name: 'ai' }
  }

  // 设置消息列表
  const setMessages = (publicId, list) => {
    if (!publicId) {
      draftMessages.value = list
      return
    }
    messagesById.value = { ...messagesById.value, [publicId]: list }
  }

  // 追加消息
  const patchMessages = (publicId, updater) => {
    const prev = publicId ? messagesById.value[publicId] || [] : draftMessages.value
    const next = updater(prev)
    setMessages(publicId, next)
  }

  // 设置AI是否正在流式输出
  const setTyping = (publicId, on) => {
    if (!publicId) return
    typingById.value = { ...typingById.value, [publicId]: on }
  }

  // 发送消息
  const sendMessage = async (text) => {
    const content = text.trim()
    if (!content || isTyping.value) return null

    const wasDraft = isDraft.value
    let publicId = activeId.value
    try {
      // 在草稿状态下，第一次发送消息时，创建对话
      if (wasDraft) {
        publicId = await commitDraftOnFirstMessage(content)
        setMessages(publicId, [
          { ...AI_WELCOME_MESSAGE },
          {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: formatMessageTime(new Date())
          }
        ])
      } else {
        // 还没加载过详情时，messageById可能没有这一条，先放欢迎语
        if (!messagesById.value[publicId]?.length) {
          setMessages(publicId, [{ ...AI_WELCOME_MESSAGE }])
        }

        const res = await appendMessage(publicId, { role: 'user', content })
        patchMessages(publicId, (prev) => [
          ...prev,
          {
            id: String(res.data.id),
            role: 'user',
            content,
            timestamp: formatMessageTime(res.data.createdAt)
          }
        ])
      }
    } catch (err) {
      ElMessage.error(err.message || '保存消息失败')
      return null
    }

    // 构建历史消息，发给后端
    const history = (messagesById.value[publicId] || [])
      .filter((m) => m.id !== AI_WELCOME_MESSAGE.id)
      .filter((m) => String(m.content || '').trim())
      .map((m) => ({ role: m.role, content: m.content }))

    const assistantId = (Date.now() + 1).toString()
    patchMessages(publicId, (prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: formatMessageTime(new Date()),
        statusText: '',
        streaming: true,
        pendingAction: null,
        actionStatus: null,
        persisted: false
      }
    ])

    // 根据id查找消息
    const findInSession = (id) => (messagesById.value[publicId] || []).find((m) => m.id === id)

    setTyping(publicId, true)

    // ai流式回复
    try {
      await chatWithAiStream(history, {
        onDelta: (piece) => {
          const msg = findInSession(assistantId)
          if (!msg) return
          msg.statusText = ''
          msg.content += piece
        },

        onStatus: (message) => {
          const msg = findInSession(assistantId)
          if (!msg) return
          // 工具执行中：气泡里提示，仍算streaming
          msg.statusText = message
        },

        onClearContent: () => {
          const msg = findInSession(assistantId)
          if (!msg) return
          msg.content = ''
        },

        onPending: ({ reply, pendingAction }) => {
          const msg = findInSession(assistantId)
          if (!msg) return
          msg.statusText = ''
          if (!msg.content) {
            msg.content = reply || ''
          } else if (reply) {
            msg.content += '\n\n' + reply
          }
          msg.pendingAction = pendingAction
          msg.actionStatus = pendingAction ? 'pending' : null
          msg.streaming = false
        },

        onDone: () => {
          const msg = findInSession(assistantId)
          if (!msg) return
          msg.statusText = ''
          msg.streaming = false
        },

        onError: (err) => {
          ElMessage.error(err.message || 'AI请求失败，请稍后再试')
        }
      })
    } catch {
      const msg = findInSession(assistantId)
      if (msg && !msg.content) {
        // 没内容，删掉空气泡
        patchMessages(publicId, (prev) => prev.filter((m) => m.id !== assistantId))
      } else if (msg) {
        // 有内容，但出错，改为普通消息
        msg.streaming = false
      }
    } finally {
      const msg = findInSession(assistantId)
      if (msg) msg.streaming = false

      // 流式结束后把ai消息写入数据库
      if (msg && String(msg.content || '').trim()) {
        try {
          const res = await appendMessage(publicId, {
            role: 'assistant',
            content: msg.content,
            pendingAction: msg.pendingAction ?? null,
            actionStatus: msg.actionStatus ?? null
          })
          if (res?.data?.id != null) {
            msg.id = String(res.data.id)
            msg.persisted = true
            if (res.data.createdAt) {
              msg.timestamp = formatMessageTime(res.data.createdAt)
            }

            if (wasDraft) {
              generateConversationTitle(publicId).catch(() => {
                // 静默失败，侧栏继续显示「新对话」
              })
            }
          }
        } catch (err) {
          ElMessage.error(err.message || '保存回复失败')
        }
      }
      // 须在 append 之后再关，避免切回页面时用旧详情盖掉未入库内容；无内容/失败也要关
      setTyping(publicId, false)
    }

    return { publicId, wasDraft }
  }

  // 从路由同步对话状态
  const syncFromRoute = async (conversationId) => {
    // 没有conversationId，说明是草稿状态
    if (!conversationId) {
      activeId.value = null
      return { ok: true, draft: true }
    }

    // 列表还没加载时，先加载
    if (!listLoaded.value) {
      await loadConversations()
    }

    const exists = conversations.value.some((c) => c.id === conversationId)
    if (exists) {
      activeId.value = conversationId
      return { ok: true, draft: false }
    }

    // 有conversationId，但不在列表中，列表过期，再拉一次
    await loadConversations()
    if (conversations.value.some((c) => c.id === conversationId)) {
      activeId.value = conversationId
      return { ok: true, draft: false }
    }

    activeId.value = null
    return { ok: false, draft: true }
  }

  const loadConversationDetail = async (publicId) => {
    const res = await getConversation(publicId)
    const conv = res.data?.conversation
    const rawMessages = res.data?.messages || []

    if (!conv?.publicId) {
      throw new Error(res.message || '对话不存在')
    }

    const messages = [{ ...AI_WELCOME_MESSAGE }, ...rawMessages.map(mapMessage)]
    const item = {
      ...mapConversations(conv),
      messages
    }

    const idx = conversations.value.findIndex((c) => c.id === item.id)
    // 如果对话已存在，更新对话
    if (idx >= 0) {
      conversations.value[idx] = item
    } else {
      // 如果对话不存在，对话插入到列表最前面
      conversations.value = [item, ...conversations.value]
    }

    activeId.value = item.id
    setMessages(item.id, messages)
    return messages
  }

  // 在草稿状态下，第一次发送消息时，创建对话
  const commitDraftOnFirstMessage = async (firstUserMessage) => {
    if (activeId.value) return activeId.value

    const res = await createConversationApi({ firstUserMessage })
    const item = {
      ...mapConversations(res.data),
      messages: [{ ...AI_WELCOME_MESSAGE }] // 本地先只放欢迎消息
    }

    conversations.value = [item, ...conversations.value]
    activeId.value = item.id
    return item.id
  }

  const renameConversation = async (publicId, title) => {
    const res = await renameConversationApi(publicId, title)
    const data = res.data
    if (!data?.publicId) return false

    conversations.value = conversations.value.map((c) =>
      c.id === data.publicId
        ? {
            ...c,
            title: data.title
          }
        : c
    )
    return true
  }

  // 生成对话标题
  const generateConversationTitle = async (publicId) => {
    // 不是新对话，直接返回
    const current = conversations.value.find((c) => c.id === publicId)
    if (current && current.title && current.title !== '新对话') {
      return current.title
    }

    const res = await generateConversationTitleApi(publicId)
    const data = res.data
    if (!data?.publicId || !data.title) return null

    conversations.value = conversations.value.map((c) =>
      c.id === data.publicId ? { ...c, title: data.title } : c
    )
    return data.title
  }

  const appendMessage = async (publicId, body) => {
    const res = await appendMessageApi(publicId, body)
    const now = Date.now()
    conversations.value = conversations.value.map((c) =>
      c.id === publicId ? { ...c, updatedAt: now } : c
    )
    return res
  }

  const updateMessageActionStatus = (publicId, messageId, actionStatus) =>
    updateMessageActionStatusApi(publicId, messageId, actionStatus)

  const deleteConversation = async (publicId) => {
    await deleteConversationApi(publicId)
    conversations.value = conversations.value.filter((c) => c.id !== publicId)

    if (activeId.value === publicId) {
      activeId.value = null
      return { switchedToDraft: true }
    }
    return { switchedToDraft: false }
  }

  return {
    conversations,
    currentMessages,
    isTyping,
    typingById,
    activeId,
    listLoaded,
    sortedConversations,
    isDraft,
    loadConversations,
    enterDraft,
    selectConversation,
    resolveAiEntry,
    setMessages,
    patchMessages,
    setTyping,
    sendMessage,
    syncFromRoute,
    loadConversationDetail,
    commitDraftOnFirstMessage,
    renameConversation,
    generateConversationTitle,
    appendMessage,
    updateMessageActionStatus,
    deleteConversation
  }
})
