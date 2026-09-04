<script setup>
import { onMounted, ref, watch } from 'vue'
import { getCaptcha } from '@/api/auth'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const props = defineProps({
  resetTrigger: { type: Number, default: 0 }
})
const emit = defineEmits(['ready-change'])

const image = ref('')
const captchaId = ref('')
const input = ref('')
// 刷新序列号，用于防止重复刷新
let refreshSeq = 0

async function refresh() {
  input.value = ''
  emit('ready-change', false)

  const ticket = ++refreshSeq
  try {
    const res = await getCaptcha()
    if (ticket !== refreshSeq) return
    captchaId.value = res.data.captchaId
    image.value = res.data.image
  } catch (error) {
    if (ticket !== refreshSeq) return
    captchaId.value = ''
    image.value = ''
    ElMessage.error(error.message || '获取图形验证码失败')
  }
}

function onInput(event) {
  // 只允许输入字母和数字
  const next = event.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)
  input.value = next
  // 如果输入了4个字符，则认为验证码输入完成
  emit('ready-change', next.length === 4)
}

onMounted(refresh)
watch(() => props.resetTrigger, refresh)

defineExpose({
  getPayload: () => ({
    captchaId: captchaId.value,
    captchaCode: input.value
  })
})
</script>

<template>
  <div>
    <label
      class="block text-[11px] font-semibold text-foreground-500 mb-1.5 uppercase tracking-wide"
    >
      图形验证码
    </label>
    <div class="flex gap-2">
      <img
        :src="image"
        width="120"
        height="40"
        alt="图形验证码"
        class="rounded-lg border border-background-300 cursor-pointer flex-shrink-0"
        title="看不清？点击换一张"
        @click="refresh"
      />
      <div class="relative flex-1">
        <input
          type="text"
          :value="input"
          placeholder="输入上图字符"
          maxlength="4"
          autocomplete="off"
          class="w-full px-3 py-2.5 text-[14px] bg-background-50 border rounded-lg placeholder:text-foreground-300 border-background-300 focus:border-primary-400 focus:ring-primary-100 focus:outline-none focus:ring-2 transition-all"
          @input="onInput"
        />
      </div>
      <button
        type="button"
        class="w-10 h-10 flex items-center justify-center rounded-lg text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer flex-shrink-0"
        title="换一张"
        @click="refresh"
      >
        <i class="ri-refresh-line text-[18px]" />
      </button>
    </div>
  </div>
</template>
