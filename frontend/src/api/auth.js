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
// 退出登录
export const logoutUser = () => request.post('/auth/logout')
