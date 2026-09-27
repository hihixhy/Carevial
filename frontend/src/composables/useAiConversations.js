import { computed, ref } from 'vue'

const TITLE_MAX = 20
const AUTO_TITLE_MAX = 16

export const AI_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    '你好！我是 Carevial 的 AI 助手。你可以直接告诉我你想做什么，或者你想了解什么，比如：\n\n• "帮我给爸爸设置每天早上8点吃降压药"\n• "阿莫西林和头孢有什么区别"\n\n我会帮你快速完成操作！',
  timestamp: '刚刚'
}

/** 路由用随机哈希（非自增）；落库时与 ai_conversations.id 一致 */
export function createConversationId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function cloneWelcome() {
  return { ...AI_WELCOME_MESSAGE }
}

function truncateTitle(text, max) {
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return '新对话'
  return t.length > max ? `${t.slice(0, max)}…` : t
}

function createConversation({ id = createConversationId(), title = '新对话', messages } = {}) {
  return {
    id,
    title,
    messages: messages ? messages.map((m) => ({ ...m })) : [cloneWelcome()],
    updatedAt: Date.now()
  }
}

/** 演示数据（仅有真实内容的会话会出现在列表；草稿不入库、不进列表） */
const conversations = ref([
  createConversation({
    id: createConversationId(),
    title: '帮我设置一个明天早上8点的提醒',
    messages: [
      cloneWelcome(),
      {
        id: 'u1',
        role: 'user',
        content: '帮我设置一个明天早上8点的提醒',
        timestamp: '刚刚'
      }
    ]
  }),
  createConversation({
    id: createConversationId(),
    title: '高血压患者需要注意什么',
    messages: [
      cloneWelcome(),
      {
        id: 'u2',
        role: 'user',
        content: '高血压患者需要注意什么',
        timestamp: '刚刚'
      }
    ]
  })
])

/** null = 草稿（URL 为 /dashboard/ai，尚未发过消息，不在列表中） */
const activeId = ref(null)

const sortedConversations = computed(() =>
  [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt)
)

const isDraft = computed(() => !activeId.value)

const activeConversation = computed(() =>
  activeId.value ? conversations.value.find((c) => c.id === activeId.value) : null
)

function getDraftMessages() {
  return [cloneWelcome()]
}

function getActiveMessages() {
  if (!activeId.value) return getDraftMessages()
  const conv = conversations.value.find((c) => c.id === activeId.value)
  return conv ? conv.messages.map((m) => ({ ...m })) : getDraftMessages()
}

function setActiveMessages(nextMessages) {
  if (!activeId.value) return
  conversations.value = conversations.value.map((c) =>
    c.id === activeId.value
      ? { ...c, messages: nextMessages.map((m) => ({ ...m })), updatedAt: Date.now() }
      : c
  )
}

/** 根据路由同步：无 param = 草稿；有 param 则选中（不存在则回草稿） */
function syncFromRoute(conversationId) {
  if (!conversationId) {
    activeId.value = null
    return { ok: true, draft: true }
  }
  if (conversations.value.some((c) => c.id === conversationId)) {
    activeId.value = conversationId
    return { ok: true, draft: false }
  }
  activeId.value = null
  return { ok: false, draft: true }
}

function selectConversation(id) {
  if (!conversations.value.some((c) => c.id === id)) return false
  activeId.value = id
  return true
}

/** 点「新对话」：只进入草稿，不往列表塞空会话 */
function enterDraft() {
  activeId.value = null
}

function deleteConversation(id) {
  conversations.value = conversations.value.filter((c) => c.id !== id)
  if (activeId.value === id) {
    activeId.value = null
    return { switchedToDraft: true }
  }
  return { switchedToDraft: false }
}

function renameConversation(id, rawTitle) {
  const trimmed = String(rawTitle || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!trimmed) return false
  const finalTitle = trimmed.slice(0, TITLE_MAX)
  let found = false
  conversations.value = conversations.value.map((c) => {
    if (c.id !== id) return c
    found = true
    return { ...c, title: finalTitle, updatedAt: Date.now() }
  })
  return found
}

/**
 * 草稿下用户发出第一条消息时才真正创建会话并返回新 id（供路由 replace）。
 * 已在某会话中则返回当前 id，不新建。
 */
function commitDraftOnFirstMessage(userContent) {
  if (activeId.value) return activeId.value

  const id = createConversationId()
  const title = truncateTitle(userContent, AUTO_TITLE_MAX)
  const conv = createConversation({
    id,
    title,
    messages: [cloneWelcome()]
  })
  conversations.value = [conv, ...conversations.value]
  activeId.value = id
  return id
}

export function useAiConversations() {
  return {
    conversations,
    sortedConversations,
    activeId,
    isDraft,
    activeConversation,
    getActiveMessages,
    setActiveMessages,
    getDraftMessages,
    syncFromRoute,
    selectConversation,
    enterDraft,
    deleteConversation,
    renameConversation,
    commitDraftOnFirstMessage,
    TITLE_MAX
  }
}
