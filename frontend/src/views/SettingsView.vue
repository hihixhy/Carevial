<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import CaptchaField from '../components/CaptchaField.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const AUTH_STORAGE_KEY = 'yaoguanjia_auth'
const SETTINGS_STORAGE_KEY = 'yaoguanjia_settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore parse error
  }
  return {
    notificationEnabled: true,
    soundEnabled: true,
    vibrationEnabled: false,
    reminderBeforeMinutes: 5,
    language: 'zh',
    timeFormat: '24h',
    weekStartsOn: '1'
  }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s))
}

const router = useRouter()

const settings = ref(loadSettings())
const displayName = ref(userStore.user?.username || '')
const nameEditing = ref(false)
const nameSaved = ref(false)

const showLogoutConfirm = ref(false)

const showPasswordModal = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const pwdConfirm = ref('')
const pwdError = ref('')
const pwdSuccess = ref(false)
const pwdSubmitting = ref(false)
const pwdShowOld = ref(false)
const pwdShowNew = ref(false)
const pwdShowConfirm = ref(false)

const showEmailModal = ref(false)
const newEmail = ref('')
const emailCode = ref('')
const emailPwd = ref('')
const emailError = ref('')
const emailSuccess = ref(false)
const emailSubmitting = ref(false)
const emailCodeSent = ref(false)
const emailCodeCountdown = ref(0)
const emailCaptchaReady = ref(false)
const emailCaptchaReset = ref(0)

let countdownTimer = null
let nameSavedTimer = null
let pwdSuccessTimer = null
let emailSuccessTimer = null

watch(emailCodeCountdown, (c) => {
  clearTimeout(countdownTimer)
  if (c <= 0) return
  countdownTimer = setTimeout(() => {
    emailCodeCountdown.value -= 1
  }, 1000)
})

onBeforeUnmount(() => {
  clearTimeout(countdownTimer)
  clearTimeout(nameSavedTimer)
  clearTimeout(pwdSuccessTimer)
  clearTimeout(emailSuccessTimer)
})

function resetPwdModal() {
  oldPassword.value = ''
  newPassword.value = ''
  pwdConfirm.value = ''
  pwdError.value = ''
  pwdSuccess.value = false
  pwdSubmitting.value = false
  pwdShowOld.value = false
  pwdShowNew.value = false
  pwdShowConfirm.value = false
}

function resetEmailModal() {
  newEmail.value = ''
  emailCode.value = ''
  emailPwd.value = ''
  emailError.value = ''
  emailSuccess.value = false
  emailSubmitting.value = false
  emailCodeSent.value = false
  emailCodeCountdown.value = 0
  emailCaptchaReady.value = false
  emailCaptchaReset.value += 1
}

function update(patch) {
  settings.value = { ...settings.value, ...patch }
  saveSettings(settings.value)
}

function handleSaveName() {
  if (!displayName.value.trim()) return
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      parsed.name = displayName.value.trim()
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed))
    }
  } catch {
    // ignore parse error
  }
  nameEditing.value = false
  nameSaved.value = true
  clearTimeout(nameSavedTimer)
  nameSavedTimer = setTimeout(() => {
    nameSaved.value = false
  }, 2000)
}

function toggle(key) {
  if (typeof settings.value[key] === 'boolean') {
    update({ [key]: !settings.value[key] })
  }
}

/* async function handleSendEmailCode() {
  emailError.value = ''
  if (!newEmail.value.trim()) {
    emailError.value = '请先输入新邮箱地址'
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail.value.trim())) {
    emailError.value = '请输入有效的邮箱地址'
    return
  }
  if (!emailCaptchaVerified.value) {
    emailError.value = '请先完成图形验证码'
    return
  }
  const result = await sendVerificationCode(newEmail.value.trim())
  if (result.success) {
    emailCodeSent.value = true
    emailCodeCountdown.value = 60
    emailCaptchaVerified.value = false
    emailCaptchaReset.value += 1
  } else {
    emailError.value = result.error || '发送失败'
    emailCaptchaVerified.value = false
    emailCaptchaReset.value += 1
  }
} */

/* async function handleChangePassword() {
  pwdError.value = ''

  if (!oldPassword.value.trim() || !newPassword.value.trim() || !pwdConfirm.value.trim()) {
    pwdError.value = '请填写所有字段'
    return
  }
  if (newPassword.value.length < 6) {
    pwdError.value = '新密码至少需要6位'
    return
  }
  if (newPassword.value !== pwdConfirm.value) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }

  pwdSubmitting.value = true
  const result = await changePassword(oldPassword.value, newPassword.value)
  pwdSubmitting.value = false

  if (result.success) {
    pwdSuccess.value = true
    clearTimeout(pwdSuccessTimer)
    pwdSuccessTimer = setTimeout(() => {
      showPasswordModal.value = false
      resetPwdModal()
    }, 1500)
  } else {
    pwdError.value = result.error || '修改失败，请重试'
  }
} */

/* async function handleChangeEmail() {
  emailError.value = ''

  if (!newEmail.value.trim() || !emailPwd.value.trim() || !emailCode.value.trim()) {
    emailError.value = '请填写所有字段'
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail.value.trim())) {
    emailError.value = '请输入有效的邮箱地址'
    return
  }

  emailSubmitting.value = true
  const result = await changeEmail(newEmail.value.trim(), emailPwd.value, emailCode.value.trim())
  emailSubmitting.value = false

  if (result.success) {
    emailSuccess.value = true
    clearTimeout(emailSuccessTimer)
    emailSuccessTimer = setTimeout(() => {
      showEmailModal.value = false
      resetEmailModal()
    }, 1500)
  } else {
    emailError.value = result.error || '修改失败，请重试'
  }
} */

function openPasswordModal() {
  resetPwdModal()
  showPasswordModal.value = true
}

function openEmailModal() {
  resetEmailModal()
  showEmailModal.value = true
}

function closePasswordModal() {
  showPasswordModal.value = false
  resetPwdModal()
}

function closeEmailModal() {
  showEmailModal.value = false
  resetEmailModal()
}

function cancelNameEdit() {
  nameEditing.value = false
  displayName.value = userStore.user?.username || ''
}

function onNameKeydown(e) {
  if (e.key === 'Enter') handleSaveName()
  if (e.key === 'Escape') cancelNameEdit()
}

function clearLocalData() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith('checkin_'))
  keys.forEach((k) => localStorage.removeItem(k))
  localStorage.removeItem(SETTINGS_STORAGE_KEY)
  window.location.reload()
}

async function handleLogout() {
  showLogoutConfirm.value = false
  await userStore.logout()
  router.replace('/')
}

function onEmailCodeInput(e) {
  emailCode.value = e.target.value.replace(/\D/g, '').slice(0, 6)
  emailError.value = ''
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 md:space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1
          class="text-[18px] md:text-[22px] font-bold text-foreground-900 tracking-tight leading-[1.1]"
        >
          个人中心
        </h1>
      </div>
    </div>

    <!-- Profile -->
    <section class="bg-white border border-background-200 rounded-2xl overflow-hidden">
      <div class="px-4 md:px-6 py-5 flex items-center justify-between">
        <h2 class="text-[15px] md:text-[16px] font-semibold text-foreground-900">个人信息</h2>
      </div>
      <div class="px-4 md:px-6 pb-5 space-y-4">
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
          >
            <span class="text-[20px] font-bold text-primary-600">
              {{ userStore.user?.username?.charAt(0) || 'U' }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <div v-if="nameEditing" class="flex items-center gap-2">
              <input
                type="text"
                v-model="displayName"
                class="flex-1 px-3 py-2 text-[15px] font-semibold text-foreground-900 bg-background-50 border border-background-300 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                placeholder="输入昵称"
                autofocus
                @keydown="onNameKeydown"
              />
              <button
                class="px-3 py-2 text-[13px] font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                @click="handleSaveName"
              >
                保存
              </button>
              <button
                class="px-3 py-2 text-[13px] font-medium text-foreground-500 hover:text-foreground-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                @click="cancelNameEdit"
              >
                取消
              </button>
            </div>
            <div v-else class="flex items-center gap-2">
              <p class="text-[16px] font-semibold text-foreground-900">{{ displayName }}</p>
              <button
                class="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                title="编辑昵称"
                @click="nameEditing = true"
              >
                <i class="ri-edit-line text-[14px]" />
              </button>
              <span
                v-if="nameSaved"
                class="text-[12px] text-emerald-600 font-medium whitespace-nowrap"
              >
                <i class="ri-check-line text-[13px]" /> 已保存
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-background-100">
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-mail-line text-[16px] text-foreground-400" />
            </div>
            <div>
              <p class="text-[13px] text-foreground-400">邮箱</p>
              <p class="text-[14px] font-medium text-foreground-700">
                {{ userStore.user?.email || '未设置' }}
              </p>
            </div>
          </div>
          <button
            class="px-3 py-1.5 text-[12px] font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            @click="openEmailModal"
          >
            修改
          </button>
        </div>
      </div>
    </section>

    <!-- Notification -->
    <section class="bg-white border border-background-200 rounded-2xl overflow-hidden">
      <div class="px-4 md:px-6 py-5">
        <h2 class="text-[15px] md:text-[16px] font-semibold text-foreground-900">通知设置</h2>
        <p class="text-[12px] text-foreground-400 mt-0.5">管理用药提醒的通知方式</p>
      </div>
      <div class="px-4 md:px-6 pb-5 space-y-0.5">
        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-notification-3-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">启用通知</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">关闭后将不会收到任何用药提醒</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button
              class="relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer"
              :class="settings.notificationEnabled ? 'bg-primary-500' : 'bg-background-300'"
              @click="toggle('notificationEnabled')"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                :class="settings.notificationEnabled ? 'translate-x-[20px]' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-volume-up-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">声音提醒</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">提醒时播放提示音</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button
              class="relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer"
              :class="[
                !settings.notificationEnabled ? 'opacity-40 cursor-not-allowed' : '',
                settings.soundEnabled ? 'bg-primary-500' : 'bg-background-300'
              ]"
              :disabled="!settings.notificationEnabled"
              @click="toggle('soundEnabled')"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                :class="settings.soundEnabled ? 'translate-x-[20px]' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-smartphone-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">震动提醒</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">提醒时同步震动</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button
              class="relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer"
              :class="[
                !settings.notificationEnabled ? 'opacity-40 cursor-not-allowed' : '',
                settings.vibrationEnabled ? 'bg-primary-500' : 'bg-background-300'
              ]"
              :disabled="!settings.notificationEnabled"
              @click="toggle('vibrationEnabled')"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                :class="settings.vibrationEnabled ? 'translate-x-[20px]' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-timer-flash-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">提前提醒</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">在用药时间前提前通知</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <select
              :value="settings.reminderBeforeMinutes"
              class="px-3 py-2 text-[13px] font-medium text-foreground-700 bg-background-50 border border-background-200 rounded-lg focus:outline-none focus:border-primary-400 cursor-pointer"
              @change="update({ reminderBeforeMinutes: Number($event.target.value) })"
            >
              <option :value="0">准时</option>
              <option :value="5">5 分钟前</option>
              <option :value="10">10 分钟前</option>
              <option :value="15">15 分钟前</option>
              <option :value="30">30 分钟前</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- Display -->
    <section class="bg-white border border-background-200 rounded-2xl overflow-hidden">
      <div class="px-4 md:px-6 py-5">
        <h2 class="text-[15px] md:text-[16px] font-semibold text-foreground-900">显示设置</h2>
        <p class="text-[12px] text-foreground-400 mt-0.5">自定义应用的显示方式</p>
      </div>
      <div class="px-4 md:px-6 pb-5 space-y-0.5">
        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-global-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">语言</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">切换界面语言</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <select
              :value="settings.language"
              class="px-3 py-2 text-[13px] font-medium text-foreground-700 bg-background-50 border border-background-200 rounded-lg focus:outline-none focus:border-primary-400 cursor-pointer"
              @change="update({ language: $event.target.value })"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-time-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">时间格式</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">选择 12 小时或 24 小时制</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <select
              :value="settings.timeFormat"
              class="px-3 py-2 text-[13px] font-medium text-foreground-700 bg-background-50 border border-background-200 rounded-lg focus:outline-none focus:border-primary-400 cursor-pointer"
              @change="update({ timeFormat: $event.target.value })"
            >
              <option value="24h">24 小时制</option>
              <option value="12h">12 小时制</option>
            </select>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-calendar-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">每周起始日</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">选择日历视图的起始日期</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <select
              :value="settings.weekStartsOn"
              class="px-3 py-2 text-[13px] font-medium text-foreground-700 bg-background-50 border border-background-200 rounded-lg focus:outline-none focus:border-primary-400 cursor-pointer"
              @change="update({ weekStartsOn: $event.target.value })"
            >
              <option value="1">周一</option>
              <option value="0">周日</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- Account -->
    <section class="bg-white border border-background-200 rounded-2xl overflow-hidden">
      <div class="px-4 md:px-6 py-5">
        <h2 class="text-[15px] md:text-[16px] font-semibold text-foreground-900">账户管理</h2>
        <p class="text-[12px] text-foreground-400 mt-0.5">管理你的账户和数据</p>
      </div>
      <div class="px-4 md:px-6 pb-5 space-y-0.5">
        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-shield-check-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">修改密码</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">定期更换密码保护账户安全</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button
              class="px-4 py-2 text-[12px] font-medium text-foreground-600 bg-background-100 hover:bg-background-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              @click="openPasswordModal"
            >
              前往修改
            </button>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-delete-bin-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">清除本地数据</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">
                清除打卡记录和本地缓存，不会影响云端数据
              </p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button
              class="px-4 py-2 text-[12px] font-medium text-foreground-600 bg-background-100 hover:bg-background-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              @click="clearLocalData"
            >
              清除
            </button>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-logout-box-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">退出登录</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">退出后需要重新登录才能访问</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button
              class="px-4 py-2 text-[12px] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              @click="showLogoutConfirm = true"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- About -->
    <section class="bg-white border border-background-200 rounded-2xl overflow-hidden">
      <div class="px-4 md:px-6 py-5">
        <h2 class="text-[15px] md:text-[16px] font-semibold text-foreground-900">关于</h2>
      </div>
      <div class="px-4 md:px-6 pb-5 space-y-0.5">
        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-information-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">版本号</p>
              <p class="text-[12px] text-foreground-400 mt-0.5">当前应用版本</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <span class="text-[13px] font-medium text-foreground-400">v1.0.0</span>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-file-text-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">用户协议</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button
              class="px-4 py-2 text-[12px] font-medium text-foreground-600 bg-background-100 hover:bg-background-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              查看
            </button>
          </div>
        </div>

        <div
          class="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-background-50/60 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0"
            >
              <i class="ri-shield-line text-[16px] text-foreground-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[14px] font-medium text-foreground-800">隐私政策</p>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <button
              class="px-4 py-2 text-[12px] font-medium text-foreground-600 bg-background-100 hover:bg-background-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              查看
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Password modal -->
    <div
      v-if="showPasswordModal"
      class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-foreground-900/40"
      @click="closePasswordModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-[400px] overflow-hidden" @click.stop>
        <div class="px-6 pt-6 pb-2">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-[16px] font-semibold text-foreground-900">修改密码</h3>
            <button
              class="w-7 h-7 rounded-md flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
              @click="closePasswordModal"
            >
              <i class="ri-close-line text-lg" />
            </button>
          </div>

          <div v-if="pwdSuccess" class="py-8 text-center">
            <div
              class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3"
            >
              <i class="ri-check-line text-[22px] text-emerald-600" />
            </div>
            <p class="text-[14px] font-medium text-foreground-900">密码修改成功</p>
            <p class="text-[12px] text-foreground-400 mt-1">下次登录请使用新密码</p>
          </div>

          <div v-else class="space-y-4">
            <div>
              <label class="block text-[12px] font-medium text-foreground-600 mb-1.5">原密码</label>
              <div class="relative">
                <input
                  :type="pwdShowOld ? 'text' : 'password'"
                  v-model="oldPassword"
                  placeholder="输入当前密码"
                  class="w-full px-3.5 py-2.5 pr-10 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  @input="pwdError = ''"
                />
                <button
                  type="button"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-foreground-400 hover:text-foreground-600 cursor-pointer"
                  @click="pwdShowOld = !pwdShowOld"
                >
                  <i :class="[pwdShowOld ? 'ri-eye-off-line' : 'ri-eye-line', 'text-[15px]']" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-[12px] font-medium text-foreground-600 mb-1.5">新密码</label>
              <div class="relative">
                <input
                  :type="pwdShowNew ? 'text' : 'password'"
                  v-model="newPassword"
                  placeholder="至少6位新密码"
                  class="w-full px-3.5 py-2.5 pr-10 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  @input="pwdError = ''"
                />
                <button
                  type="button"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-foreground-400 hover:text-foreground-600 cursor-pointer"
                  @click="pwdShowNew = !pwdShowNew"
                >
                  <i :class="[pwdShowNew ? 'ri-eye-off-line' : 'ri-eye-line', 'text-[15px]']" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-[12px] font-medium text-foreground-600 mb-1.5"
                >确认新密码</label
              >
              <div class="relative">
                <input
                  :type="pwdShowConfirm ? 'text' : 'password'"
                  v-model="pwdConfirm"
                  placeholder="再次输入新密码"
                  class="w-full px-3.5 py-2.5 pr-10 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  @input="pwdError = ''"
                  @keydown.enter="handleChangePassword"
                />
                <button
                  type="button"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-foreground-400 hover:text-foreground-600 cursor-pointer"
                  @click="pwdShowConfirm = !pwdShowConfirm"
                >
                  <i :class="[pwdShowConfirm ? 'ri-eye-off-line' : 'ri-eye-line', 'text-[15px]']" />
                </button>
              </div>
            </div>

            <p v-if="pwdError" class="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {{ pwdError }}
            </p>

            <button
              :disabled="pwdSubmitting"
              class="w-full py-2.5 bg-foreground-900 hover:bg-foreground-800 disabled:opacity-50 text-background-50 text-[13px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              @click="handleChangePassword"
            >
              {{ pwdSubmitting ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Email modal -->
    <div
      v-if="showEmailModal"
      class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-foreground-900/40"
      @click="closeEmailModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-[400px] overflow-hidden" @click.stop>
        <div class="px-6 pt-6 pb-2">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-[16px] font-semibold text-foreground-900">修改邮箱</h3>
            <button
              class="w-7 h-7 rounded-md flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
              @click="closeEmailModal"
            >
              <i class="ri-close-line text-lg" />
            </button>
          </div>

          <div v-if="emailSuccess" class="py-8 text-center">
            <div
              class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3"
            >
              <i class="ri-check-line text-[22px] text-emerald-600" />
            </div>
            <p class="text-[14px] font-medium text-foreground-900">邮箱修改成功</p>
            <p class="text-[12px] text-foreground-400 mt-1">已更新为新邮箱 {{ newEmail }}</p>
          </div>

          <div v-else class="space-y-4">
            <div class="px-3.5 py-2.5 bg-background-50 border border-background-200 rounded-lg">
              <p class="text-[11px] text-foreground-400">当前邮箱</p>
              <p class="text-[13px] font-medium text-foreground-700">{{ user?.email }}</p>
            </div>

            <div>
              <label class="block text-[12px] font-medium text-foreground-600 mb-1.5"
                >当前密码</label
              >
              <input
                type="password"
                v-model="emailPwd"
                placeholder="输入当前密码确认身份"
                class="w-full px-3.5 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                @input="emailError = ''"
              />
            </div>

            <div>
              <label class="block text-[12px] font-medium text-foreground-600 mb-1.5">新邮箱</label>
              <input
                type="email"
                v-model="newEmail"
                placeholder="输入新的邮箱地址"
                class="w-full px-3.5 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                @input="emailError = ''"
              />
            </div>

            <div class="border border-background-200 rounded-xl p-4 bg-background-50/60">
              <p
                class="text-[12px] font-semibold text-foreground-800 mb-3 flex items-center gap-1.5"
              >
                <i class="ri-mail-check-line text-[15px] text-primary-600" />
                验证新邮箱
              </p>

              <CaptchaField
                :reset-trigger="emailCaptchaReset"
                @ready-change="emailCaptchaReady = $event"
              />

              <div class="flex gap-2 mt-3">
                <input
                  type="text"
                  :value="emailCode"
                  placeholder="6位验证码"
                  maxlength="6"
                  class="flex-1 px-3.5 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  @input="onEmailCodeInput"
                />
                <button
                  type="button"
                  :disabled="emailCodeCountdown > 0 || !emailCaptchaReady"
                  class="px-4 py-2.5 text-[12px] font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer bg-foreground-900 hover:bg-foreground-800 text-background-50 disabled:bg-background-200 disabled:text-foreground-400 disabled:cursor-not-allowed"
                  @click="handleSendEmailCode"
                >
                  {{
                    emailCodeCountdown > 0
                      ? `${emailCodeCountdown}s`
                      : emailCodeSent
                        ? '重新发送'
                        : '发送验证码'
                  }}
                </button>
              </div>
            </div>

            <p v-if="emailError" class="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {{ emailError }}
            </p>

            <button
              :disabled="emailSubmitting"
              class="w-full py-2.5 bg-foreground-900 hover:bg-foreground-800 disabled:opacity-50 text-background-50 text-[13px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              @click="handleChangeEmail"
            >
              {{ emailSubmitting ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :open="showLogoutConfirm"
      title="确认退出"
      description="退出后需要重新登录才能访问数据"
      confirm-text="退出"
      icon="ri-logout-box-line"
      @close="showLogoutConfirm = false"
      @confirm="handleLogout"
    />
  </div>
</template>
