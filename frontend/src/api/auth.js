import request from './request'

// 获取图形验证码
export const getCaptcha = () => request.get('/auth/captcha')
// 发送验证码
export const sendEmailCode = (data) => request.post('/auth/send-code', data)
// 注册
export const registerUser = (data) => request.post('/auth/register', data)
// 密码登录
export const loginByPassword = (data) => request.post('/auth/login', data)
// 验证码登录
export const loginByCode = (data) => request.post('/auth/login-code', data)
// 获取用户信息
export const getUserInfo = () => request.get('/auth/me')
// 修改用户名
export const updateProfile = (data) => request.patch('/auth/profile', data)
// 修改通知设置
export const updateSettings = (data) => request.patch('/auth/settings', data)
// 修改密码
export const changePassword = (data) => request.patch('/auth/password', data)
// 修改邮箱
export const changeEmail = (data) => request.post('/auth/change-email', data)
// 上传头像
export const uploadAvatar = (formData) => request.post('/auth/avatar', formData)
// 退出登录
export const logoutUser = () => request.post('/auth/logout')
