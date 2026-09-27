<script setup>
import { nextTick, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirmAction } from '../api/ai'
import { renderMarkdown } from '../utils/markdown'
import { useAiStore } from '../stores/ai'

const route = useRoute()
const router = useRouter()

const suggestions = [
  '帮我设置一个明天早上8点的提醒',
  '查看即将过期的药品',
  '高血压患者需要注意什么',
  '给妈妈添加维生素D'
]

const aiStore = useAiStore()

const messages = computed(() => aiStore.currentMessages)
const isTyping = computed(() => aiStore.isTyping)

const input = ref('')
// 防止待确认消息被连点
const confirmingId = ref(null)
const messagesEndRef = ref(null)
// 草稿首条消息后 replace 路由时，跳过一次按路由重载，避免打断流式
let skipRouteReload = false

watch(
  () => route.params.conversationId,
  async (conversationId) => {
    if (skipRouteReload) {
      skipRouteReload = false
      return
    }
    const id = typeof conversationId === 'string' ? conversationId : null
    input.value = ''

    try {
      const result = await aiStore.syncFromRoute(id)

      if (!id) {
        // 草稿
        return
      }

      if (!result.ok) {
        router.replace({ name: 'ai' })
        return
      }

      // 对话正在流式，不重新加载
      if (aiStore.typingById[id]) {
        return
      }

      // 正式对话,加载对话详情
      await aiStore.loadConversationDetail(id)
    } catch (err) {
      ElMessage.error(err.message || '加载对话失败')
      router.replace({ name: 'ai' })
    }
  },
  { immediate: true }
)

// messages或isTyping变化时，滚动到消息底部
watch(
  [messages, isTyping],
  async () => {
    await nextTick()
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  },
  { deep: true }
)

const sendMessage = async (text) => {
  const content = String(text || '').trim()
  if (!content || isTyping.value) return null

  const wasDraft = aiStore.isDraft
  input.value = ''

  const result = await aiStore.sendMessage(content)
  if (!result) return

  if (wasDraft) {
    skipRouteReload = true
    await router.replace({
      name: 'ai-conversation',
      params: { conversationId: result.publicId }
    })
  }
}

const handleSubmit = () => {
  sendMessage(input.value)
}

// 根据id查找消息
const findMessage = (id) => messages.value.find((m) => m.id === id)

const onConfirmAction = async (msgId) => {
  const msg = findMessage(msgId)
  if (!msg?.pendingAction || msg.actionStatus !== 'pending') return
  if (confirmingId.value) return

  confirmingId.value = msgId
  try {
    const res = await confirmAction(msg.pendingAction)
    msg.actionStatus = 'done'
    try {
      await aiStore.updateMessageActionStatus(aiStore.activeId, msg.id, 'done')
    } catch {
      ElMessage.warning('已执行，但确认卡状态同步失败')
    }
    ElMessage.success(res.message || '执行成功')
  } catch (err) {
    ElMessage.error(err.message || '确认失败，请稍后再试')
  } finally {
    confirmingId.value = null
  }
}

const onCancelAction = async (msgId) => {
  const msg = findMessage(msgId)
  if (!msg || msg.actionStatus !== 'pending') return
  try {
    await aiStore.updateMessageActionStatus(aiStore.activeId, msg.id, 'cancelled')
    msg.actionStatus = 'cancelled'
  } catch (err) {
    ElMessage.error(err.message || '取消失败，请稍后再试')
  }
}
</script>

<template>
  <div class="flex h-[calc(100dvh-56px)] min-h-0 w-full flex-col overflow-hidden lg:h-dvh">
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div
        class="mx-auto max-w-5xl space-y-4 px-4 pt-8 pb-4 md:space-y-5 md:px-6 md:pt-12 md:pb-6 lg:px-10 lg:pt-16"
      >
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
                    :disabled="confirmingId === msg.id || !msg.persisted"
                    @click="onConfirmAction(msg.id)"
                  >
                    确认执行
                  </button>
                  <button
                    type="button"
                    class="flex-1 py-2.5 text-[13px] text-foreground-600 bg-white hover:bg-background-100 border border-background-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="confirmingId === msg.id || !msg.persisted"
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
                'text-[13px] text-foreground-300 mt-1.5',
                msg.role === 'user' ? 'text-right mr-1' : 'ml-1'
              ]"
            >
              {{ msg.timestamp }}
            </p>
          </div>
        </div>

        <div ref="messagesEndRef" />
      </div>
    </div>

    <div class="w-full flex-shrink-0 bg-background-100">
      <div class="mx-auto max-w-5xl px-4 pt-2 md:px-6 lg:px-10">
        <div class="pb-2 md:pb-3 flex flex-wrap gap-2">
          <button
            v-for="(s, i) in suggestions"
            :key="i"
            class="text-[12px] md:text-[13px] text-foreground-500 bg-white hover:bg-background-50 border border-background-200/70 hover:border-background-300 px-3 md:px-4 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            @click="sendMessage(s)"
          >
            {{ s }}
          </button>
        </div>

        <form class="pb-4 md:pb-6 flex items-center gap-3" @submit.prevent="handleSubmit">
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
