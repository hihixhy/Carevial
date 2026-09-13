import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  sendEmailCode,
  registerUser,
  loginByPassword,
  loginByCode,
  getUserInfo,
  updateProfile,
  updateSettings,
  changePassword,
  changeEmail,
  uploadAvatar,
  logoutUser
} from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  // 是否已加载用户信息(调过/auth/me)
  const bootstrapped = ref(false)

  // 是否已登录
  const isAuthenticated = computed(() => !!user.value)

  const sendCode = (payload) => sendEmailCode(payload)

  const register = (payload) => registerUser(payload)

  const login = async (payload) => {
    const res = await loginByPassword(payload)
    user.value = res.data.user
    return res
  }

  const loginCode = async (payload) => {
    const res = await loginByCode(payload)
    user.value = res.data.user
    return res
  }

  const getUser = async () => {
    try {
      const res = await getUserInfo()
      user.value = res.data
    } catch {
      user.value = null
    } finally {
      bootstrapped.value = true
    }
  }

  const updateUserProfile = async (payload) => {
    const res = await updateProfile(payload)
    user.value = res.data
    return res
  }

  const updateUserSettings = async (payload) => {
    const res = await updateSettings(payload)
    user.value = res.data
    return res
  }

  const changeUserPassword = (payload) => changePassword(payload)

  const changeUserEmail = async (payload) => {
    const res = await changeEmail(payload)
    user.value = res.data
    return res
  }

  const uploadUserAvatar = async (formData) => {
    const res = await uploadAvatar(formData)
    user.value = res.data
    return res
  }

  const logout = async () => {
    try {
      await logoutUser()
    } finally {
      user.value = null
    }
  }

  return {
    user,
    bootstrapped,
    isAuthenticated,
    sendCode,
    register,
    login,
    loginCode,
    getUser,
    updateUserProfile,
    updateUserSettings,
    changeUserPassword,
    changeUserEmail,
    uploadUserAvatar,
    logout
  }
})
