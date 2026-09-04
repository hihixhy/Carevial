<script setup>
import { nextTick, ref, watch } from 'vue'

const initialMessages = [
  {
    id: '1',
    role: 'assistant',
    content:
      '你好！我是 Carevial 的 AI 助手。你可以直接告诉我你想做什么，比如：\n\n• "帮我给爸爸设置每天早上8点吃降压药"\n• "家里布洛芬还够吗"\n• "阿莫西林和头孢有什么区别"\n\n我会帮你快速完成操作！',
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
const messagesEndRef = ref(null)

watch(
  [messages, isTyping],
  async () => {
    await nextTick()
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  },
  { deep: true }
)

function getMockResponse(text) {
  const q = text.toLowerCase()

  if (q.includes('提醒') || q.includes('早上') || q.includes('晚上') || q.includes('设置')) {
    return '好的，我已经记录了你的提醒需求。在接下来的版本中，我会直接帮你完成提醒设置。目前你可以前往「提醒」页面手动添加，也可以在「添加药品」页面录入新药品后自动创建提醒。\n\n有其他需要吗？'
  }

  if (q.includes('过期') || q.includes('有效期')) {
    return '目前你的药箱中有 4 种药品将在 30 天内过期：\n\n• 布洛芬缓释胶囊 — 还剩 4 天\n• 小儿氨酚黄那敏颗粒 — 有效期至 2026-09-05\n• 硝苯地平控释片 — 有效期至 2026-12-30\n• 阿托伐他汀钙片 — 有效期至 2026-11-18\n\n建议尽快补充或处理。需要我帮你做些什么吗？'
  }

  if (q.includes('高血压') || q.includes('区别') || q.includes('注意')) {
    return '关于用药咨询，我是基于通用知识来回答的，不能替代医生建议。如果你有具体的用药问题，建议咨询专业医生或药师。\n\n不过我可以帮你管理药品信息和提醒，确保按时服药。需要我帮你设置提醒吗？'
  }

  if (q.includes('添加') || q.includes('妈妈') || q.includes('爸爸') || q.includes('维生素')) {
    return '收到！我已经记下来了。你可以前往「药品」页面点击「添加药品」，填写基本信息。之后我也会在提醒页面帮你设置定时提醒。\n\n需要我现在带你去添加药品页面吗？'
  }

  return '好的，我收到了你的消息。目前我可以帮你：\n\n1. 添加和管理药品信息\n2. 设置用药提醒\n3. 查看过期药品\n4. 回答用药常识问题\n\n请告诉我更多细节，我会尽力帮你！'
}

function sendMessage(text) {
  if (!text.trim()) return
  const userMsg = {
    id: Date.now().toString(),
    role: 'user',
    content: text,
    timestamp: '刚刚'
  }
  messages.value = [...messages.value, userMsg]
  input.value = ''
  isTyping.value = true

  setTimeout(() => {
    const aiMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getMockResponse(text),
      timestamp: '刚刚'
    }
    messages.value = [...messages.value, aiMsg]
    isTyping.value = false
  }, 1200)
}

function handleSubmit(e) {
  e.preventDefault()
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
                'rounded-2xl px-4 md:px-5 py-3 md:py-3.5 text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-white border border-background-200/70 text-foreground-800 rounded-bl-md'
              ]"
            >
              {{ msg.content }}
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

        <div v-if="isTyping" class="flex justify-center">
          <div
            class="bg-white border border-background-200/70 rounded-2xl rounded-bl-md px-4 md:px-5 py-3 md:py-3.5"
          >
            <div class="flex items-center gap-1.5">
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

        <form class="px-2 md:px-3 pb-4 md:pb-6 flex items-center gap-3" @submit="handleSubmit">
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
