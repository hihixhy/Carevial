<script setup>
import { nextTick, ref, watch } from 'vue'
import { chatWithAiStream, confirmAction } from '../api/ai'
import { renderMarkdown } from '../utils/markdown'

const initialMessages = [
  {
    id: '1',
    role: 'assistant',
    content:
      '你好！我是 Carevial 的 AI 助手。你可以直接告诉我你想做什么，或者你想了解什么，比如：\n\n• "帮我给爸爸设置每天早上8点吃降压药"\n• "阿莫西林和头孢有什么区别"\n\n我会帮你快速完成操作！',
    timestamp: '刚刚'
  }
]

const suggestions = [
  '帮我设置一个明天早上8点的提醒',
  '查看即将过期的药品',
  '高血压患者需要注意什么',
  '给妈妈添加维生素D'
]

const messages = ref([...initialMessages])
const input = ref('')
const isTyping = ref(false)
// 防止待确认消息被连点
const confirmingId = ref(null)
const messagesEndRef = ref(null)

watch(
  [messages, isTyping],
  async () => {
    await nextTick()
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  },
  { deep: true }
)

// 只把 role + content 传给后端；可去掉开场白，避免占额度
// 并过滤掉空消息
const buildHistoryForApi = () => {
  return messages.value
    .filter((m) => m.id !== '1')
    .filter((m) => String(m.content || '').trim())
    .map((m) => ({ role: m.role, content: m.content }))
}

const sendMessage = async (text) => {
  const content = text.trim()
  if (!content || isTyping.value) return

  messages.value = [
    ...messages.value,
    {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: '刚刚'
    }
  ]
  input.value = ''

  // 先往messages数组添加一个占位消息，等后端流式返回内容后，再更新内容
  const history = buildHistoryForApi()
  const assistantId = (Date.now() + 1).toString()
  messages.value = [
    ...messages.value,
    {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: '刚刚',
      statusText: '',
      streaming: true,
      pendingAction: null,
      actionStatus: null
    }
  ]

  isTyping.value = true

  try {
    await chatWithAiStream(history, {
      onDelta: (piece) => {
        const msg = findMessage(assistantId)
        if (!msg) return
        msg.statusText = ''
        msg.content += piece
      },

      onStatus: (message) => {
        const msg = findMessage(assistantId)
        if (!msg) return
        // 工具执行中：气泡里提示，仍算streaming
        msg.statusText = message
      },

      onPending: ({ reply, pendingAction }) => {
        const msg = findMessage(assistantId)
        if (!msg) return
        msg.statusText = ''
        msg.content = reply || ''
        msg.pendingAction = pendingAction
        msg.actionStatus = pendingAction ? 'pending' : null
        msg.streaming = false
      },

      onDone: () => {
        const msg = findMessage(assistantId)
        if (!msg) return
        msg.statusText = ''
        msg.streaming = false
      },

      onError: (err) => {
        ElMessage.error(err.message || 'AI请求失败，请稍后再试')
      }
    })
  } catch {
    const msg = findMessage(assistantId)
    if (msg && !msg.content) {
      // 没内容，删掉空气泡
      messages.value = messages.value.filter((m) => m.id !== assistantId)
    } else if (msg) {
      // 有内容，但出错，改为普通消息
      msg.streaming = false
    }
  } finally {
    isTyping.value = false
    const msg = findMessage(assistantId)
    if (msg) msg.streaming = false
  }
}

const findMessage = (id) => messages.value.find((m) => m.id === id)

const onConfirmAction = async (msgId) => {
  const msg = findMessage(msgId)
  if (!msg?.pendingAction || msg.actionStatus !== 'pending') return
  if (confirmingId.value) return

  confirmingId.value = msgId
  try {
    const res = await confirmAction(msg.pendingAction)
    msg.actionStatus = 'done'
    ElMessage.success(res.message || '执行成功')
  } catch (err) {
    ElMessage.error(err.message || '确认失败，请稍后再试')
  } finally {
    confirmingId.value = null
  }
}

const onCancelAction = (msgId) => {
  const msg = findMessage(msgId)
  if (!msg || msg.actionStatus !== 'pending') return
  msg.actionStatus = 'cancelled'
}

const handleSubmit = () => {
  sendMessage(input.value)
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl min-h-full flex flex-col">
    <div class="flex-1 flex flex-col min-h-0">
      <div class="px-2 md:px-3 py-4 md:py-6 space-y-4 md:space-y-5 min-h-0">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-center']"
        >
          <div :class="msg.role === 'user' ? 'max-w-[75%] md:max-w-[60%]' : 'w-[95%]'">
            <div
              :class="[
                'rounded-2xl px-4 md:px-5 py-3 md:py-3.5 text-[13px] md:text-[14px] leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md whitespace-pre-wrap'
                  : 'bg-white border border-background-200/70 text-foreground-800 rounded-bl-md'
              ]"
            >
              <!-- 用户:纯文本 -->
              <div v-if="msg.role === 'user'" class="whitespace-pre-wrap">
                {{ msg.content }}
              </div>
              <!-- 流式输出:纯文本，结束后:markdown -->
              <div v-else-if="msg.streaming" class="whitespace-pre-wrap">
                <template v-if="msg.content">
                  {{ msg.content }}
                </template>
                <span v-else-if="msg.statusText" class="text-foreground-500">{{
                  msg.statusText
                }}</span>
                <div v-else class="flex items-center gap-1.5 py-0.5">
                  <span class="w-2 h-2 rounded-full bg-foreground-300 animate-bounce"></span>
                  <span
                    class="w-2 h-2 rounded-full bg-foreground-300 animate-bounce"
                    style="animation-delay: 0.15s"
                  ></span>
                  <span
                    class="w-2 h-2 rounded-full bg-foreground-300 animate-bounce"
                    style="animation-delay: 0.3s"
                  ></span>
                </div>
              </div>
              <!-- AI:Markdown渲染 -->
              <div v-else class="ai-md" v-html="renderMarkdown(msg.content)"></div>

              <div
                v-if="msg.role === 'assistant' && msg.pendingAction"
                class="mt-3 rounded-xl border border-background-200 bg-background-50 p-4"
              >
                <div class="flex items-center gap-2 mb-3">
                  <i class="ri-shield-check-line text-primary-600 text-[16px]"></i>
                  <p class="text-[13px] font-semibold text-foreground-900">需要你确认后才会执行</p>
                </div>

                <div class="space-y-2 text-[13px]">
                  <div
                    v-for="(row, idx) in msg.pendingAction.fields || []"
                    :key="idx"
                    class="flex items-center gap-3"
                  >
                    <span class="min-w-14 flex-shrink-0 text-foreground-400">{{ row.label }}</span>
                    <span class="font-medium text-foreground-900">{{ row.value }}</span>
                  </div>
                </div>

                <div v-if="msg.actionStatus === 'pending'" class="flex gap-2 mt-4">
                  <button
                    type="button"
                    class="flex-1 py-2.5 text-[13px] text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="confirmingId === msg.id"
                    @click="onConfirmAction(msg.id)"
                  >
                    确认执行
                  </button>
                  <button
                    type="button"
                    class="flex-1 py-2.5 text-[13px] text-foreground-600 bg-white hover:bg-background-100 border border-background-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="confirmingId === msg.id"
                    @click="onCancelAction(msg.id)"
                  >
                    取消
                  </button>
                </div>

                <div
                  v-else-if="msg.actionStatus === 'done'"
                  class="mt-4 flex items-center gap-2 text-[13px] text-primary-700 font-medium"
                >
                  <i class="ri-checkbox-circle-fill text-[16px]"></i>
                  {{ msg.pendingAction.resultText?.done || '已执行成功' }}
                </div>

                <div
                  v-else-if="msg.actionStatus === 'cancelled'"
                  class="mt-4 flex items-center gap-2 text-[13px] text-foreground-400 font-medium"
                >
                  <i class="ri-close-circle-line text-[16px]"></i>
                  {{ msg.pendingAction.resultText?.cancelled || '已取消，未执行任何操作' }}
                </div>
              </div>
            </div>

            <p
              :class="[
                'text-[11px] text-foreground-300 mt-1.5',
                msg.role === 'user' ? 'text-right mr-1' : 'ml-1'
              ]"
            >
              {{ msg.timestamp }}
            </p>
          </div>
        </div>

        <div ref="messagesEndRef" />
      </div>

      <div class="mt-auto sticky bottom-0 bg-background-100 flex-shrink-0">
        <div v-if="messages.length === 1" class="px-2 md:px-3 pb-2 md:pb-3 flex flex-wrap gap-2">
          <button
            v-for="(s, i) in suggestions"
            :key="i"
            class="text-[12px] md:text-[13px] text-foreground-500 bg-white hover:bg-background-50 border border-background-200/70 hover:border-background-300 px-3 md:px-4 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            @click="sendMessage(s)"
          >
            {{ s }}
          </button>
        </div>

        <form
          class="px-2 md:px-3 pb-4 md:pb-6 flex items-center gap-3"
          @submit.prevent="handleSubmit"
        >
          <input
            v-model="input"
            type="text"
            placeholder="输入你想做的事情..."
            class="flex-1 px-4 md:px-5 py-2.5 md:py-3 text-[13px] md:text-[14px] text-foreground-900 bg-white border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          <button
            type="submit"
            :disabled="!input.trim()"
            class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-background-200 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
          >
            <i class="ri-send-plane-fill text-white text-[13px] md:text-[14px]"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
