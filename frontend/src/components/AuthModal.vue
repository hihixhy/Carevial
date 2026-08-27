<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LogoMark from './LogoMark.vue'
import CaptchaField from './CaptchaField.vue'
import { isSafeInternalPath } from '../utils/navigation'
import { useUserStore } from '../stores'
import { isEmail, isUsernameValid, isPasswordValid, isCodeValid } from '../utils/validate'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const props = defineProps({
  open: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

function goAfterAuth() {
  const redirect = route.query.redirect
  if (isSafeInternalPath(redirect)) router.replace(redirect)
  else router.replace({ name: 'dashboard' })
}

const mode = ref('login')
const loginMethod = ref('password')
const email = ref('')
const password = ref('')
const username = ref('')
const confirmPassword = ref('')
const code = ref('')
const error = ref('')
const submitting = ref(false)
const codeSent = ref(false)
const countdown = ref(0)
const captchaReady = ref(false)
const sendingCode = ref(false)
const captchaReset = ref(0)
const captchaField = ref(null)

let timer = null

function tick() {
  clearTimeout(timer)
  if (countdown.value <= 0) return
  timer = setTimeout(() => {
    countdown.value -= 1
    tick()
  }, 1000)
}

watch(countdown, (value) => {
  if (value > 0) tick()
  else clearTimeout(timer)
})

onBeforeUnmount(() => clearTimeout(timer))

function switchMode(next) {
  mode.value = next
  loginMethod.value = 'password'
  email.value = ''
  password.value = ''
  username.value = ''
  confirmPassword.value = ''
  code.value = ''
  codeSent.value = false
  countdown.value = 0
  error.value = ''
  captchaReady.value = false
  captchaReset.value += 1
}

watch(
  () => props.open,
  (open) => {
    if (open) switchMode('login')
  }
)

function toggleLoginMethod() {
  if (loginMethod.value === 'password') {
    loginMethod.value = 'code'
    password.value = ''
  } else {
    loginMethod.value = 'password'
    code.value = ''
    codeSent.value = false
    countdown.value = 0
  }
  error.value = ''
  captchaReady.value = false
  captchaReset.value += 1
}

async function requestCode() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = '请先输入邮箱地址'
    return
  }
  if (!isEmail(email.value)) {
    error.value = '邮箱格式不正确，请输入有效的邮箱地址'
    return
  }
  const payload = captchaField.value?.getPayload()
  if (!payload?.captchaId || !payload?.captchaCode || payload.captchaCode.length !== 4) {
    error.value = '请先完成图形验证码'
    return
  }
  if (sendingCode.value) return
  sendingCode.value = true
  try {
    await userStore.sendCode({
      email: email.value.trim(),
      purpose: mode.value === 'login' ? 'login' : 'register',
      captchaId: payload.captchaId,
      captchaCode: payload.captchaCode
    })
    codeSent.value = true
    countdown.value = 60
    ElMessage.success('验证码已发送')
  } catch (err) {
    ElMessage.error(err.message || '发送失败')
  } finally {
    sendingCode.value = false
    captchaReady.value = false
    captchaReset.value += 1
  }
}

async function submitLogin() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = '请填写邮箱'
    return
  }
  if (!isEmail(email.value)) {
    error.value = '邮箱格式不正确，请输入有效的邮箱地址'
    return
  }
  if (loginMethod.value === 'password') {
    if (!password.value.trim()) {
      error.value = '请输入密码'
      return
    }
  } else {
    if (!codeSent.value) {
      error.value = '请先发送验证码'
      return
    }
    if (!code.value.trim()) {
      error.value = '请输入验证码'
      return
    }
    if (!isCodeValid(code.value)) {
      error.value = '验证码格式不正确，请输入有效的验证码'
      return
    }
  }
  submitting.value = true
  try {
    if (loginMethod.value === 'password') {
      await userStore.login({
        email: email.value.trim(),
        password: password.value
      })
      ElMessage.success('登录成功')
      goAfterAuth()
    } else {
      await userStore.loginCode({
        email: email.value.trim(),
        code: code.value.trim()
      })
      ElMessage.success('登录成功')
      goAfterAuth()
    }
  } catch (err) {
    ElMessage.error(err.message || '登录失败')
  } finally {
    submitting.value = false
  }
}

async function submitRegister() {
  error.value = ''
  if (
    !username.value.trim() ||
    !email.value.trim() ||
    !password.value.trim() ||
    !confirmPassword.value.trim() ||
    !code.value.trim()
  ) {
    error.value = '请填写所有必填项'
    return
  }
  if (!isUsernameValid(username.value)) {
    error.value = '用户名长度需在1-10位之间'
    return
  }
  if (!isEmail(email.value)) {
    error.value = '邮箱格式不正确，请输入有效的邮箱地址'
    return
  }
  if (!isPasswordValid(password.value)) {
    error.value = '密码需6-12位，且包含大小写字母和数字'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  if (!isCodeValid(code.value)) {
    error.value = '验证码格式不正确'
    return
  }
  if (!codeSent.value) {
    error.value = '请先发送验证码'
    return
  }
  submitting.value = true
  try {
    await userStore.register({
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value,
      confirmPassword: confirmPassword.value,
      code: code.value.trim()
    })
    const savedEmail = email.value.trim()
    ElMessage.success('注册成功，请登录')
    switchMode('login')
    email.value = savedEmail
  } catch (err) {
    ElMessage.error(err.message || '注册失败')
  } finally {
    submitting.value = false
  }
}

const inputClass =
  'w-full pl-11 pr-4 py-2.5 text-[14px] bg-background-50 border border-background-300 rounded-lg placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all'
const labelClass =
  'block text-[11px] font-semibold text-foreground-500 mb-1.5 uppercase tracking-wide'
const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 text-foreground-300 text-[15px]'
const submitClass =
  'w-full py-2.5 bg-foreground-900 hover:bg-foreground-800 disabled:bg-foreground-300 text-background-50 text-[14px] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2'
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-foreground-950/30 backdrop-blur-sm" @click="emit('close')" />

    <div
      class="relative bg-white rounded-2xl p-8 w-full max-w-[420px] shadow-2xl max-h-[90vh] overflow-y-auto"
    >
      <button
        class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
        @click="emit('close')"
      >
        <i class="ri-close-line text-[18px]" />
      </button>

      <div class="flex justify-center mb-4">
        <LogoMark size="lg" :show-text="false" />
      </div>

      <div class="text-center mb-6">
        <h2 class="text-[20px] font-bold mb-1">{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h2>
        <p class="text-[13px] text-foreground-400">
          {{ mode === 'login' ? '登录即可体验全部功能' : '注册后开始管理全家用药' }}
        </p>
      </div>

      <div class="flex bg-background-100 rounded-lg p-1 mb-6">
        <button
          class="flex-1 py-2 text-[13px] font-medium rounded-md transition-all duration-200 whitespace-nowrap cursor-pointer"
          :class="
            mode === 'login'
              ? 'bg-white text-foreground-900 shadow-sm'
              : 'text-foreground-400 hover:text-foreground-600'
          "
          @click="switchMode('login')"
        >
          登录
        </button>
        <button
          class="flex-1 py-2 text-[13px] font-medium rounded-md transition-all duration-200 whitespace-nowrap cursor-pointer"
          :class="
            mode === 'register'
              ? 'bg-white text-foreground-900 shadow-sm'
              : 'text-foreground-400 hover:text-foreground-600'
          "
          @click="switchMode('register')"
        >
          注册
        </button>
      </div>

      <form v-if="mode === 'login'" class="space-y-4" @submit.prevent="submitLogin">
        <div>
          <label :class="labelClass">邮箱</label>
          <div class="relative">
            <i class="ri-mail-line" :class="iconClass" />
            <input
              v-model="email"
              type="email"
              placeholder="请输入邮箱"
              autocomplete="email"
              :class="inputClass"
            />
          </div>
        </div>

        <div v-if="loginMethod === 'password'">
          <label :class="labelClass">密码</label>
          <div class="relative">
            <i class="ri-lock-line" :class="iconClass" />
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
              :class="inputClass"
            />
          </div>
        </div>

        <div v-if="loginMethod === 'code'">
          <CaptchaField
            ref="captchaField"
            class="mb-4"
            :reset-trigger="captchaReset"
            @ready-change="(value) => (captchaReady = value)"
          />
          <label :class="labelClass">验证码</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <i class="ri-shield-keyhole-line" :class="iconClass" />
              <input
                v-model="code"
                type="text"
                placeholder="6位验证码"
                maxlength="6"
                :class="inputClass"
              />
            </div>
            <button
              type="button"
              :disabled="countdown > 0 || !captchaReady"
              class="px-4 py-2.5 text-[12px] font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer bg-foreground-900 hover:bg-foreground-800 text-background-50 disabled:bg-background-200 disabled:text-foreground-400 disabled:cursor-not-allowed"
              @click="requestCode"
            >
              {{ countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送验证码' }}
            </button>
          </div>
        </div>

        <p v-if="error" class="mb-3 text-[12px] text-red-500 leading-snug">
          {{ error }}
        </p>

        <button type="submit" :disabled="submitting" :class="submitClass">
          <template v-if="submitting">
            <i class="ri-loader-4-line animate-spin text-[18px]" />
            登录中...
          </template>
          <template v-else>登录</template>
        </button>

        <p class="text-center">
          <button
            type="button"
            class="text-[12px] text-foreground-400 hover:text-foreground-700 transition-colors cursor-pointer inline-flex items-center gap-1"
            @click="toggleLoginMethod"
          >
            <template v-if="loginMethod === 'password'">
              使用验证码登录
              <i class="ri-arrow-right-line text-[11px]" />
            </template>
            <template v-else>
              <i class="ri-arrow-left-line text-[11px]" />
              使用密码登录
            </template>
          </button>
        </p>
      </form>

      <form v-else class="space-y-4" @submit.prevent="submitRegister">
        <div>
          <label :class="labelClass">昵称</label>
          <div class="relative">
            <i class="ri-user-line" :class="iconClass" />
            <input
              v-model="username"
              type="text"
              placeholder="请输入昵称"
              autocomplete="name"
              :class="inputClass"
            />
          </div>
        </div>

        <div>
          <label :class="labelClass">邮箱</label>
          <div class="relative">
            <i class="ri-mail-line" :class="iconClass" />
            <input
              v-model="email"
              type="email"
              placeholder="请输入邮箱"
              autocomplete="email"
              :class="inputClass"
            />
          </div>
        </div>

        <div>
          <label :class="labelClass">密码</label>
          <div class="relative">
            <i class="ri-lock-line" :class="iconClass" />
            <input
              v-model="password"
              type="password"
              placeholder="请输入6-12位密码"
              autocomplete="new-password"
              :class="inputClass"
            />
          </div>
        </div>

        <div>
          <label :class="labelClass">确认密码</label>
          <div class="relative">
            <i class="ri-lock-line" :class="iconClass" />
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              autocomplete="new-password"
              :class="inputClass"
            />
          </div>
        </div>

        <div>
          <CaptchaField
            ref="captchaField"
            class="mb-4"
            :reset-trigger="captchaReset"
            @ready-change="(value) => (captchaReady = value)"
          />
          <label :class="labelClass">验证码</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <i class="ri-shield-keyhole-line" :class="iconClass" />
              <input
                v-model="code"
                type="text"
                placeholder="6位验证码"
                maxlength="6"
                :class="inputClass"
              />
            </div>
            <button
              type="button"
              :disabled="countdown > 0 || !captchaReady"
              class="px-4 py-2.5 text-[12px] font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer bg-foreground-900 hover:bg-foreground-800 text-background-50 disabled:bg-background-200 disabled:text-foreground-400 disabled:cursor-not-allowed"
              @click="requestCode"
            >
              {{ countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送验证码' }}
            </button>
          </div>
        </div>

        <p v-if="error" class="mb-3 text-[12px] text-red-500 leading-snug">
          {{ error }}
        </p>

        <button type="submit" :disabled="submitting" :class="submitClass">
          <template v-if="submitting">
            <i class="ri-loader-4-line animate-spin text-[18px]" />
            注册中...
          </template>
          <template v-else>注册</template>
        </button>
      </form>

      <p class="text-center text-[12px] text-foreground-400 mt-5">
        {{ mode === 'login' ? '还没有账号？' : '已有账号？'
        }}<button
          class="ml-1 text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
          @click="switchMode(mode === 'login' ? 'register' : 'login')"
        >
          {{ mode === 'login' ? '立即注册' : '去登录' }}
        </button>
      </p>

      <div class="mt-4 pt-4 border-t border-background-100 text-center">
        <p class="text-[11px] text-foreground-400">
          {{ mode === 'login' ? '登录' : '注册' }}即表示同意<a
            href="#"
            class="text-foreground-500 hover:text-foreground-700 underline underline-offset-2 mx-1"
            >服务条款</a
          >和<a
            href="#"
            class="text-foreground-500 hover:text-foreground-700 underline underline-offset-2 ml-1"
            >隐私政策</a
          >
        </p>
      </div>
    </div>
  </div>
</template>
