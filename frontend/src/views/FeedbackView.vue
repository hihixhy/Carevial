<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import LogoMark from '../components/LogoMark.vue'
import { useInView } from '../composables/useInView.js'

const CATEGORIES = [
  {
    value: 'bug',
    label: '问题报告',
    icon: 'ri-bug-line',
    desc: '应用闪退、功能异常、显示错误等技术问题'
  },
  {
    value: 'feature',
    label: '功能建议',
    icon: 'ri-lightbulb-line',
    desc: '希望新增的功能或对现有功能的改进建议'
  },
  {
    value: 'consult',
    label: '使用咨询',
    icon: 'ri-question-line',
    desc: '不知道怎么用、需要操作指导等使用问题'
  },
  {
    value: 'other',
    label: '其他反馈',
    icon: 'ri-chat-smile-2-line',
    desc: '产品体验、界面设计、或其他任何想说的'
  }
]

const FAQ_ITEMS = [
  {
    q: '如何添加新的家庭成员？',
    a: '进入"家庭档案"页面，点击右上角的"添加成员"按钮，填写基本信息即可。每位成员都可以拥有独立的用药档案。'
  },
  {
    q: '提醒不生效怎么办？',
    a: '请先在"设置-通知设置"中确认通知权限已开启，并检查手机系统设置中是否允许了应用通知。'
  },
  {
    q: '打卡记录可以删除吗？',
    a: '可以的。在"打卡"页面中，长按某条记录可以选择删除。注意删除后不可恢复。'
  },
  {
    q: '数据和隐私安全吗？',
    a: '非常重视数据安全。所有数据加密传输和存储，我们不会将你的数据分享给任何第三方。'
  }
]

const MAX_FILES = 5
const MAX_SIZE = 10 * 1024 * 1024

const heroLoaded = ref(false)
const category = ref('')
const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')
const formError = ref('')
const submitting = ref(false)
const success = ref(false)
const attachments = ref([])
const dragOver = ref(false)
const fileInputRef = ref(null)
const honeypot = ref('')

const { target: sec1Target, inView: sec1InView } = useInView()

const selectedCategoryLabel = computed(
  () => CATEGORIES.find((c) => c.value === category.value)?.label || ''
)

function selectCategory(value) {
  category.value = value
  formError.value = ''
}

let heroTimer = null

onMounted(() => {
  heroTimer = setTimeout(() => {
    heroLoaded.value = true
  }, 80)
})

onBeforeUnmount(() => {
  clearTimeout(heroTimer)
  attachments.value.forEach((a) => {
    if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
  })
})

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function addFiles(files) {
  const incoming = Array.from(files)
  const remaining = MAX_FILES - attachments.value.length
  if (remaining <= 0) return

  const valid = []
  for (let i = 0; i < Math.min(incoming.length, remaining); i += 1) {
    const f = incoming[i]
    if (f.size > MAX_SIZE) continue
    const isImage = f.type.startsWith('image/')
    valid.push({
      file: f,
      id: `${Date.now()}-${i}-${Math.random()}`,
      previewUrl: isImage ? URL.createObjectURL(f) : undefined
    })
  }

  if (valid.length > 0) {
    attachments.value = [...attachments.value, ...valid]
  }
}

function removeAttachment(id) {
  const item = attachments.value.find((a) => a.id === id)
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
  attachments.value = attachments.value.filter((a) => a.id !== id)
}

function handleDrop(e) {
  e.preventDefault()
  dragOver.value = false
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    addFiles(e.dataTransfer.files)
  }
}

function onFileChange(e) {
  if (e.target.files) addFiles(e.target.files)
  e.target.value = ''
}

function resetForm() {
  success.value = false
  category.value = ''
  name.value = ''
  email.value = ''
  subject.value = ''
  message.value = ''
  formError.value = ''
  honeypot.value = ''
  attachments.value.forEach((a) => {
    if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
  })
  attachments.value = []
}

function scrollToTop(e) {
  e.preventDefault()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handleSubmit(e) {
  e.preventDefault()
  formError.value = ''

  if (honeypot.value.trim() !== '') {
    success.value = true
    return
  }

  if (!category.value) {
    formError.value = '请选择反馈类型'
    return
  }
  if (!name.value.trim()) {
    formError.value = '请填写姓名'
    return
  }
  if (!email.value.trim()) {
    formError.value = '请填写邮箱'
    return
  }
  if (!subject.value.trim()) {
    formError.value = '请填写主题'
    return
  }
  if (!message.value.trim()) {
    formError.value = '请填写反馈内容'
    return
  }
  if (message.value.length > 500) {
    formError.value = '反馈内容不能超过500个字符'
    return
  }

  let finalMessage = message.value.trim()
  if (attachments.value.length > 0) {
    const fileNames = attachments.value.map((a) => a.file.name).join('、')
    const fileInfo = `\n\n---\n已选择 ${attachments.value.length} 个附件（未收集）：${fileNames}`
    if (finalMessage.length + fileInfo.length > 500) {
      finalMessage = `${finalMessage.slice(0, 500 - fileInfo.length - 3)}...`
    }
    finalMessage += fileInfo
  }

  submitting.value = true
  try {
    const params = new URLSearchParams()
    params.set('name', name.value)
    params.set('email', email.value)
    params.set('subject', subject.value)
    params.set('message', finalMessage)
    params.set('category', category.value)
    params.set('company_alt', honeypot.value)

    const res = await fetch('https://readdy.ai/api/form/d9qo5q4nlsngrm4lm2og', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })
    const responseText = await res.text()
    let parsed = {}
    try {
      parsed = JSON.parse(responseText)
    } catch {
      // ignore
    }

    if (res.ok && parsed.code === 'OK') {
      success.value = true
    } else {
      const serverMsg =
        parsed?.meta?.message || parsed?.meta?.detail || responseText || '提交失败，请稍后重试'
      if (serverMsg.includes('spam') || serverMsg.includes('form data is spam')) {
        formError.value = '提交失败，请稍后重试'
      } else {
        formError.value = serverMsg
      }
    }
  } catch {
    formError.value = '网络异常，请重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background-50 text-foreground-900 antialiased">
    <nav class="fixed top-0 left-0 right-0 z-40 bg-background-50/80 backdrop-blur-md">
      <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <LogoMark size="sm" show-text />
        <RouterLink
          to="/"
          class="px-4 py-2 bg-foreground-900 hover:bg-foreground-800 text-background-50 text-[13px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          返回首页
        </RouterLink>
      </div>
    </nav>

    <section class="pt-20 pb-12 md:pt-28 md:pb-16 px-6">
      <div
        class="max-w-6xl mx-auto text-center transition-all duration-700 ease-out"
        :class="heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <div
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary-300/50 bg-primary-50/40 mb-6"
        >
          <i class="ri-feedback-line text-[13px] text-primary-600" />
          <span class="text-[12px] font-medium text-primary-700">联系与反馈</span>
        </div>

        <h1
          class="font-heading text-[36px] sm:text-[44px] md:text-[56px] font-medium leading-[1.1] tracking-tight mb-5"
        >
          我们很乐意
          <br />
          <span class="italic">倾听你的声音</span>
        </h1>

        <p
          class="text-[15px] md:text-[17px] text-foreground-500 leading-relaxed max-w-[520px] mx-auto"
        >
          无论你遇到了问题、有了新想法、还是只是想聊聊使用感受 — 每一个反馈都会帮助我们变得更好。
        </p>
      </div>
    </section>

    <section ref="sec1Target" class="pb-16 md:pb-24 px-6">
      <div
        class="max-w-[640px] mx-auto transition-all duration-700"
        :class="sec1InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
      >
        <div
          v-if="success"
          class="bg-white border border-background-200 rounded-2xl p-10 md:p-14 text-center"
        >
          <div
            class="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5"
          >
            <i class="ri-check-line text-[32px] text-emerald-500" />
          </div>
          <h2 class="text-[22px] font-bold mb-2">感谢你的反馈!</h2>
          <p class="text-[14px] text-foreground-400 max-w-[360px] mx-auto mb-8">
            我们已经收到你的信息，团队会认真查看每一条反馈并在必要时与你联系。
          </p>
          <div class="flex items-center justify-center gap-3">
            <RouterLink
              to="/"
              class="px-6 py-2.5 bg-foreground-900 hover:bg-foreground-800 text-background-50 text-[14px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              返回首页
            </RouterLink>
            <button
              class="px-6 py-2.5 text-[14px] font-medium text-foreground-600 hover:text-foreground-900 bg-background-100 hover:bg-background-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              @click="resetForm"
            >
              继续反馈
            </button>
          </div>
        </div>

        <div v-else class="bg-white border border-background-200 rounded-2xl overflow-hidden">
          <div class="px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-background-100">
            <div class="flex items-center gap-3 mb-1">
              <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <i class="ri-edit-line text-[18px] text-primary-600" />
              </div>
              <div>
                <h2 class="text-[16px] font-semibold">填写反馈</h2>
                <p class="text-[12px] text-foreground-400">
                  所有带 <span class="text-red-500">*</span> 的字段为必填
                </p>
              </div>
            </div>
          </div>

          <form data-readdy-form="true" class="px-6 md:px-8 py-5 space-y-5" @submit="handleSubmit">
            <div>
              <label class="block text-[12px] font-semibold text-foreground-700 mb-2.5">
                反馈类型 <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  v-for="cat in CATEGORIES"
                  :key="cat.value"
                  type="button"
                  class="flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer"
                  :class="
                    category === cat.value
                      ? 'border-primary-400 bg-primary-50/60 shadow-[0_0_0_1px_rgba(var(--primary-500),0.12)]'
                      : 'border-background-200 bg-background-50 hover:border-background-300 hover:bg-background-100'
                  "
                  @click="selectCategory(cat.value)"
                >
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    :class="
                      category === cat.value
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-background-100 text-foreground-400'
                    "
                  >
                    <i :class="[cat.icon, 'text-[15px]']" />
                  </div>
                  <div>
                    <p
                      class="text-[13px] font-semibold"
                      :class="category === cat.value ? 'text-primary-700' : 'text-foreground-700'"
                    >
                      {{ cat.label }}
                    </p>
                    <p class="text-[11px] text-foreground-400 mt-0.5 leading-relaxed">
                      {{ cat.desc }}
                    </p>
                  </div>
                </button>
              </div>
              <p v-if="category" class="text-[11px] text-foreground-400 mt-2 ml-1">
                已选择：<span class="font-medium text-foreground-600">{{
                  selectedCategoryLabel
                }}</span>
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[12px] font-semibold text-foreground-700 mb-1.5">
                  姓名 <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <i
                    class="ri-user-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-300 text-[14px]"
                  />
                  <input
                    type="text"
                    name="name"
                    v-model="name"
                    placeholder="你的名字"
                    autocomplete="name"
                    class="w-full pl-10 pr-4 py-2.5 text-[13px] bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    @input="formError = ''"
                  />
                </div>
              </div>
              <div>
                <label class="block text-[12px] font-semibold text-foreground-700 mb-1.5">
                  邮箱 <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <i
                    class="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-300 text-[14px]"
                  />
                  <input
                    type="email"
                    name="email"
                    v-model="email"
                    placeholder="your@email.com"
                    autocomplete="email"
                    class="w-full pl-10 pr-4 py-2.5 text-[13px] bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    @input="formError = ''"
                  />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-[12px] font-semibold text-foreground-700 mb-1.5">
                主题 <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <i
                  class="ri-pencil-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-300 text-[14px]"
                />
                <input
                  type="text"
                  name="subject"
                  v-model="subject"
                  placeholder="简要描述你遇到的问题或建议"
                  class="w-full pl-10 pr-4 py-2.5 text-[13px] bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  @input="formError = ''"
                />
              </div>
            </div>

            <div>
              <label class="block text-[12px] font-semibold text-foreground-700 mb-1.5">
                详细描述 <span class="text-red-500">*</span>
                <span class="text-foreground-300 font-normal ml-2">({{ message.length }}/500)</span>
              </label>
              <textarea
                name="message"
                v-model="message"
                placeholder="请详细描述：你遇到了什么问题？是如何发生的？你期望的结果是什么？..."
                maxlength="500"
                rows="6"
                class="w-full px-4 py-3 text-[13px] leading-relaxed bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
                @input="formError = ''"
              />

              <div
                v-if="message.length === 0"
                class="mt-3 p-3 rounded-xl bg-background-50 border border-background-100"
              >
                <p class="text-[11px] text-foreground-400 flex items-center gap-1.5 mb-1.5">
                  <i class="ri-information-line text-[13px]" />
                  好的反馈通常包含这些信息：
                </p>
                <ul class="space-y-1 pl-5">
                  <li class="text-[11px] text-foreground-400 flex items-start gap-1.5">
                    <span class="text-foreground-300 mt-0.5">·</span>
                    问题发生的具体场景和操作步骤
                  </li>
                  <li class="text-[11px] text-foreground-400 flex items-start gap-1.5">
                    <span class="text-foreground-300 mt-0.5">·</span>
                    你使用的设备和系统版本
                  </li>
                  <li class="text-[11px] text-foreground-400 flex items-start gap-1.5">
                    <span class="text-foreground-300 mt-0.5">·</span>
                    期望的正确表现是什么
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label class="block text-[12px] font-semibold text-foreground-700 mb-1.5">
                截图或附件
                <span class="text-foreground-300 font-normal ml-2">
                  (可选，最多 {{ MAX_FILES }} 个文件，每个不超过 10MB)
                </span>
              </label>

              <div v-if="attachments.length > 0" class="space-y-2 mb-3">
                <div
                  v-for="att in attachments"
                  :key="att.id"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background-50 border border-background-200 group"
                >
                  <img
                    v-if="att.previewUrl"
                    :src="att.previewUrl"
                    :alt="att.file.name"
                    class="w-10 h-10 rounded-lg object-cover border border-background-200 flex-shrink-0"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
                  >
                    <i class="ri-file-line text-[18px] text-foreground-400" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-medium text-foreground-700 truncate">
                      {{ att.file.name }}
                    </p>
                    <p class="text-[11px] text-foreground-400">{{ formatSize(att.file.size) }}</p>
                  </div>

                  <button
                    type="button"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
                    @click="removeAttachment(att.id)"
                  >
                    <i class="ri-close-line text-[15px]" />
                  </button>
                </div>
              </div>

              <div
                v-if="attachments.length < MAX_FILES"
                class="relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer"
                :class="
                  dragOver
                    ? 'border-primary-400 bg-primary-50/40'
                    : 'border-background-200 hover:border-background-300 hover:bg-background-50'
                "
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop="handleDrop"
                @click="fileInputRef?.click()"
              >
                <div
                  class="w-12 h-12 rounded-2xl bg-background-100 flex items-center justify-center mx-auto mb-3"
                >
                  <i
                    class="text-[22px] transition-colors"
                    :class="
                      dragOver
                        ? 'ri-upload-cloud-2-line text-primary-500'
                        : 'ri-image-add-line text-foreground-400'
                    "
                  />
                </div>
                <p class="text-[13px] font-medium text-foreground-700 mb-1">
                  {{ dragOver ? '松开即可添加文件' : '点击上传或拖拽文件到此处' }}
                </p>
                <p class="text-[11px] text-foreground-400">
                  支持图片（JPG, PNG, GIF）和常见文档（PDF, Word, Excel）
                </p>
                <input
                  ref="fileInputRef"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  class="hidden"
                  @change="onFileChange"
                />
              </div>

              <div
                v-if="attachments.length > 0"
                class="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200"
              >
                <i class="ri-information-line text-[15px] text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-[12px] text-amber-700">
                    当前表单暂不支持直接上传文件，附件文件名会附在反馈内容中一并提交。如需发送截图或大文件，请发送至
                    <a
                      href="mailto:support@carevial.com"
                      class="text-amber-800 font-medium underline underline-offset-2 mx-1"
                      >support@carevial.com</a
                    >
                  </p>
                </div>
              </div>
            </div>

            <input
              type="text"
              name="company_alt"
              v-model="honeypot"
              tabindex="-1"
              autocomplete="off"
              aria-hidden="true"
              readonly
              class="absolute opacity-0 pointer-events-none"
              style="position: absolute; left: -9999px; top: -9999px"
            />

            <input type="hidden" name="category" :value="category" />

            <div
              v-if="formError"
              class="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600"
            >
              <i class="ri-error-warning-line text-[16px] flex-shrink-0" />
              {{ formError }}
            </div>

            <div class="pt-2">
              <button
                type="submit"
                :disabled="submitting"
                class="w-full py-3 bg-foreground-900 hover:bg-foreground-800 disabled:bg-foreground-300 text-background-50 text-[14px] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
              >
                <template v-if="submitting">
                  <i class="ri-loader-4-line animate-spin text-[18px]" />
                  提交中...
                </template>
                <template v-else>
                  提交反馈
                  <i class="ri-send-plane-line text-[15px]" />
                </template>
              </button>
              <p class="text-center text-[11px] text-foreground-300 mt-3">
                提交即表示同意我们的
                <a
                  href="#"
                  class="text-foreground-500 hover:text-foreground-700 underline underline-offset-2 mx-1"
                  >服务条款</a
                >
                和
                <a
                  href="#"
                  class="text-foreground-500 hover:text-foreground-700 underline underline-offset-2 ml-1"
                  >隐私政策</a
                >
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>

    <section class="pb-20 md:pb-28 px-6 bg-background-100/40">
      <div class="max-w-[640px] mx-auto">
        <div class="text-center mb-10">
          <h2
            class="font-heading text-[22px] md:text-[28px] font-medium leading-[1.2] tracking-tight mb-3"
          >
            其他联系方式
          </h2>
          <p class="text-[14px] text-foreground-400">如果你更喜欢通过其他渠道联系我们</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            class="bg-white border border-background-200 rounded-2xl p-6 text-center transition-all hover:border-background-300"
          >
            <div
              class="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4"
            >
              <i class="ri-mail-open-line text-[22px] text-primary-600" />
            </div>
            <h3 class="text-[14px] font-semibold mb-1">邮件联系</h3>
            <p class="text-[12px] text-foreground-400 mb-3">直接发送邮件给我们，可附带截图和文件</p>
            <a
              href="mailto:support@carevial.com"
              class="text-[13px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              support@carevial.com
            </a>
          </div>

          <div
            class="bg-white border border-background-200 rounded-2xl p-6 text-center transition-all hover:border-background-300"
          >
            <div
              class="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4"
            >
              <i class="ri-time-line text-[22px] text-primary-600" />
            </div>
            <h3 class="text-[14px] font-semibold mb-1">响应时间</h3>
            <p class="text-[12px] text-foreground-400 mb-3">我们会在1-2个工作日内回复</p>
            <p class="text-[13px] font-medium text-foreground-500">工作日 9:00 - 18:00</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 md:py-24 px-6">
      <div class="max-w-[640px] mx-auto">
        <div class="text-center mb-10">
          <h2
            class="font-heading text-[22px] md:text-[28px] font-medium leading-[1.2] tracking-tight mb-3"
          >
            常见问题
          </h2>
          <p class="text-[14px] text-foreground-400">在提交反馈前，也许这里已有答案</p>
        </div>

        <div class="space-y-3">
          <details
            v-for="(faq, idx) in FAQ_ITEMS"
            :key="idx"
            class="group bg-white border border-background-200 rounded-xl overflow-hidden"
          >
            <summary class="px-5 py-4 flex items-center justify-between cursor-pointer list-none">
              <span class="text-[14px] font-medium text-foreground-700 pr-4">{{ faq.q }}</span>
              <div
                class="w-6 h-6 rounded-full bg-background-100 flex items-center justify-center flex-shrink-0 group-open:bg-primary-50 transition-colors"
              >
                <i
                  class="ri-arrow-down-s-line text-[14px] text-foreground-400 group-open:text-primary-600 group-open:rotate-180 transition-transform"
                />
              </div>
            </summary>
            <div class="px-5 pb-4">
              <p class="text-[13px] text-foreground-500 leading-relaxed">{{ faq.a }}</p>
            </div>
          </details>
        </div>

        <p class="text-center mt-8 text-[13px] text-foreground-400">
          没找到答案？
          <a
            href="#"
            class="text-primary-600 hover:text-primary-700 font-medium ml-1 cursor-pointer"
            @click="scrollToTop"
          >
            立即提交反馈
          </a>
        </p>
      </div>
    </section>

    <footer class="py-10 px-6 border-t border-background-100">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <LogoMark size="sm" show-text />
        <div class="flex items-center gap-6">
          <RouterLink
            to="/"
            class="text-[12px] text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
          >
            首页
          </RouterLink>
          <RouterLink to="/feedback" class="text-[12px] text-foreground-600 font-medium">
            问题反馈
          </RouterLink>
        </div>
        <p class="text-[11px] text-foreground-300">© 2026 Carevial</p>
      </div>
    </footer>
  </div>
</template>
