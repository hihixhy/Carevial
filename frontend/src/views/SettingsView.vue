<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import CaptchaField from '../components/CaptchaField.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import UserAvatar from '../components/UserAvatar.vue'
import { useUserStore } from '../stores/user'
import { isEmail, isUsernameValid, isPasswordValid, isCodeValid } from '../utils/validate'

const userStore = useUserStore()
const router = useRouter()

const displayName = ref(userStore.user?.username || '')
const pwdError = ref('')
const emailError = ref('')

// 修改用户名
const nameEditing = ref(false)
const nameSaving = ref(false)
const settingsSaving = ref(false)

const showLogoutConfirm = ref(false)

// 修改密码
const showPasswordModal = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const pwdConfirm = ref('')
const pwdSuccess = ref(false)
const pwdSubmitting = ref(false)

// 修改邮箱
const showEmailModal = ref(false)
const newEmail = ref('')
const emailCode = ref('')
const emailPwd = ref('')
const emailSuccess = ref(false)
const emailSubmitting = ref(false)
// 是否已发送验证码
const emailCodeSent = ref(false)
// 验证码倒计时
const emailCodeCountdown = ref(0)
// 图形验证码是否完成
const emailCaptchaReady = ref(false)
// 图形验证码重置计数，用于触发 CaptchaField 重置
const emailCaptchaReset = ref(0)
const emailCaptchaRef = ref(null)
const emailSendingCode = ref(false)

// 上传头像
const avatarInputRef = ref(null)
const avatarUploading = ref(false)

let countdownTimer = null
let pwdSuccessTimer = null
let emailSuccessTimer = null

// 如果在编辑，不改用户名
watch(
  () => userStore.user?.username,
  (name) => {
    if (!nameEditing.value) displayName.value = name || ''
  }
)

watch(emailCodeCountdown, (c) => {
  clearTimeout(countdownTimer)
  if (c <= 0) return
  countdownTimer = setTimeout(() => {
    emailCodeCountdown.value -= 1
  }, 1000)
})

onBeforeUnmount(() => {
  clearTimeout(countdownTimer)
  clearTimeout(pwdSuccessTimer)
  clearTimeout(emailSuccessTimer)
})

// 保存用户名
const handleSaveName = async () => {
  const username = displayName.value.trim()
  if (!username) {
    ElMessage.error('用户名不能为空')
    return
  }
  if (!isUsernameValid(username)) {
    ElMessage.error('用户名长度需在1-10位之间')
    return
  }
  if (nameSaving.value) return
  nameSaving.value = true
  try {
    await userStore.updateUserProfile({ username })
    nameEditing.value = false
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    nameSaving.value = false
  }
}

const cancelNameEdit = () => {
  nameEditing.value = false
  displayName.value = userStore.user?.username || ''
}

const onNameKeydown = (e) => {
  if (e.key === 'Enter') handleSaveName()
  if (e.key === 'Escape') cancelNameEdit()
}

// 保存通知设置
const saveSettings = async (patch) => {
  const u = userStore.user
  if (!u || settingsSaving.value) return

  const payload = {
    notificationEnabled: u.notificationEnabled,
    soundEnabled: u.soundEnabled,
    reminderBeforeMinutes: u.reminderBeforeMinutes,
    ...patch
  }

  settingsSaving.value = true
  try {
    await userStore.updateUserSettings(payload)
  } catch (err) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    settingsSaving.value = false
  }
}

const toggle = (key) => {
  const u = userStore.user
  if (!u) return
  if (key === 'soundEnabled' && !u.notificationEnabled) return
  saveSettings({ [key]: !u[key] })
}

const onReminderChange = (e) => {
  saveSettings({ reminderBeforeMinutes: Number(e.target.value) })
}

const resetPwdModal = () => {
  oldPassword.value = ''
  newPassword.value = ''
  pwdConfirm.value = ''
  pwdError.value = ''
  pwdSuccess.value = false
  pwdSubmitting.value = false
}

const openPasswordModal = () => {
  resetPwdModal()
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  resetPwdModal()
}

// 修改密码
const handleChangePassword = async () => {
  pwdError.value = ''
  if (!oldPassword.value || !newPassword.value || !pwdConfirm.value) {
    pwdError.value = '请填写所有字段'
    return
  }
  if (!isPasswordValid(newPassword.value)) {
    pwdError.value = '密码需6-12位，且包含大小写字母和数字'
    return
  }
  if (newPassword.value !== pwdConfirm.value) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }
  if (oldPassword.value === newPassword.value) {
    pwdError.value = '新密码不能与旧密码相同'
    return
  }
  if (pwdSubmitting.value) return
  pwdSubmitting.value = true
  try {
    await userStore.changeUserPassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
      confirmPassword: pwdConfirm.value
    })
    pwdSuccess.value = true
    clearTimeout(pwdSuccessTimer)
    pwdSuccessTimer = setTimeout(() => {
      closePasswordModal()
    }, 1500)
  } catch (err) {
    ElMessage.error(err.message || '修改密码失败，请重试')
  } finally {
    pwdSubmitting.value = false
  }
}

const resetEmailModal = () => {
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

const openEmailModal = () => {
  resetEmailModal()
  showEmailModal.value = true
}

const closeEmailModal = () => {
  showEmailModal.value = false
  resetEmailModal()
}

// 发送修改邮箱验证码
const handleSendEmailCode = async () => {
  emailError.value = ''
  const email = newEmail.value.trim()
  if (!email) {
    emailError.value = '请输入新邮箱'
    return
  }
  if (!isEmail(email)) {
    emailError.value = '请输入有效的邮箱地址'
    return
  }
  const payload = emailCaptchaRef.value?.getPayload()
  if (!payload?.captchaId || !payload?.captchaCode || payload.captchaCode.length !== 4) {
    emailError.value = '请先完成图形验证码'
    return
  }

  if (emailSendingCode.value) return
  emailSendingCode.value = true
  try {
    await userStore.sendCode({
      email,
      purpose: 'change_email',
      captchaId: payload.captchaId,
      captchaCode: payload.captchaCode
    })
    emailCodeSent.value = true
    emailCodeCountdown.value = 60
    ElMessage.success('验证码已发送')
  } catch (err) {
    ElMessage.error(err.message || '发送失败')
  } finally {
    emailSendingCode.value = false
    emailCaptchaReady.value = false
    emailCaptchaReset.value += 1
  }
}

// 修改邮箱
const handleChangeEmail = async () => {
  emailError.value = ''
  const email = newEmail.value.trim()
  if (!email || !emailPwd.value || !emailCode.value) {
    emailError.value = '请填写所有字段'
    return
  }
  if (!isEmail(email)) {
    emailError.value = '请输入有效的邮箱地址'
    return
  }
  if (!isCodeValid(emailCode.value)) {
    emailError.value = '验证码格式不正确，请输入6位数字验证码'
    return
  }

  if (emailSubmitting.value) return
  emailSubmitting.value = true
  try {
    await userStore.changeUserEmail({
      newEmail: email,
      code: emailCode.value,
      password: emailPwd.value
    })
    emailSuccess.value = true
    clearTimeout(emailSuccessTimer)
    emailSuccessTimer = setTimeout(() => {
      closeEmailModal()
    }, 1500)
  } catch (err) {
    ElMessage.error(err.message || '修改邮箱失败，请重试')
  } finally {
    emailSubmitting.value = false
  }
}

// 触发头像上传
const triggerAvatarInput = () => {
  avatarInputRef.value?.click()
}

// 上传头像
const handleAvatarChange = async (e) => {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowed.includes(file.type)) {
    ElMessage.error('请上传 JPG、PNG、WEBP 格式图片')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return
  }

  const fd = new FormData()
  fd.append('file', file)

  avatarUploading.value = true
  try {
    await userStore.uploadUserAvatar(fd)
    ElMessage.success('头像上传成功')
  } catch (err) {
    ElMessage.error(err.message || '头像上传失败，请重试')
  } finally {
    avatarUploading.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  showLogoutConfirm.value = false
  await userStore.logout()
  router.replace('/')
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
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="relative flex-shrink-0 rounded-full cursor-pointer disabled:opacity-60 group"
              :disabled="avatarUploading"
              title="更换头像"
              @click="triggerAvatarInput"
            >
              <user-avatar
                :username="userStore.user?.username"
                :avatar-url="userStore.user?.avatarUrl"
                size-class="w-14 h-14"
                text-class="text-[20px]"
              />
              <!-- 右下角相机角标 -->
              <span
                class="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-sm border-2 border-white group-hover:bg-primary-600 transition-colors"
              >
                <i class="ri-camera-line text-[12px]" />
              </span>
            </button>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleAvatarChange"
            />
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
              :class="userStore.user?.notificationEnabled ? 'bg-primary-500' : 'bg-background-300'"
              @click="toggle('notificationEnabled')"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                :class="
                  userStore.user?.notificationEnabled ? 'translate-x-[20px]' : 'translate-x-0'
                "
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
                !userStore.user?.notificationEnabled ? 'opacity-40 cursor-not-allowed' : '',
                userStore.user?.soundEnabled ? 'bg-primary-500' : 'bg-background-300'
              ]"
              :disabled="!userStore.user?.notificationEnabled"
              @click="toggle('soundEnabled')"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                :class="userStore.user?.soundEnabled ? 'translate-x-[20px]' : 'translate-x-0'"
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
              :value="userStore.user?.reminderBeforeMinutes"
              class="px-3 py-2 text-[13px] font-medium text-foreground-700 bg-background-50 border border-background-200 rounded-lg focus:outline-none focus:border-primary-400 cursor-pointer"
              @change="onReminderChange"
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
        <div class="px-6 pt-6 pb-6">
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
              <label class="block text-[12px] font-medium text-foreground-600 mb-1.5">旧密码</label>
              <div class="relative">
                <input
                  type="password"
                  v-model="oldPassword"
                  placeholder="输入当前密码"
                  class="w-full px-3.5 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  @input="pwdError = ''"
                />
              </div>
            </div>

            <div>
              <label class="block text-[12px] font-medium text-foreground-600 mb-1.5">新密码</label>
              <div class="relative">
                <input
                  type="password"
                  v-model="newPassword"
                  placeholder="请输入6-12位密码"
                  class="w-full px-3.5 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  @input="pwdError = ''"
                />
              </div>
            </div>

            <div>
              <label class="block text-[12px] font-medium text-foreground-600 mb-1.5"
                >确认新密码</label
              >
              <div class="relative">
                <input
                  type="password"
                  v-model="pwdConfirm"
                  placeholder="再次输入新密码"
                  class="w-full px-3.5 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  @input="pwdError = ''"
                  @keydown.enter="handleChangePassword"
                />
              </div>
            </div>

            <p v-if="pwdError" class="text-[12px] text-red-500 leading-snug">
              <i class="ri-error-warning-line"></i> {{ pwdError }}
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
        <div class="px-6 pt-6 pb-6">
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
              <p class="text-[13px] font-medium text-foreground-700">
                {{ userStore.user?.email || '未设置' }}
              </p>
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
                ref="emailCaptchaRef"
                :reset-trigger="emailCaptchaReset"
                @ready-change="(value) => (emailCaptchaReady = value)"
              />

              <div class="flex gap-2 mt-3">
                <input
                  v-model="emailCode"
                  type="text"
                  placeholder="6位验证码"
                  maxlength="6"
                  class="flex-1 px-3.5 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  @input="emailError = ''"
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

            <p v-if="emailError" class="text-[12px] text-red-500 leading-snug">
              <i class="ri-error-warning-line"></i> {{ emailError }}
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
