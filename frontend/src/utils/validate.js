// 非空校验
const isNotEmpty = (value) => {
  return value !== undefined && value !== null && value !== ''
}

// 邮箱校验
const isEmail = (email) => {
  if (!isNotEmpty(email)) return false
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return reg.test(String(email).trim())
}

// 用户名校验（1-10位）
const isUsernameValid = (username) => {
  if (!isNotEmpty(username)) return false
  const name = String(username).trim()
  return name.length >= 1 && name.length <= 10
}

// 密码校验（6-12位，至少要大小写字母+数字）
const isPasswordValid = (password) => {
  if (!isNotEmpty(password)) return false
  const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,12}$/
  return reg.test(password)
}

// 邮箱验证码校验（6位数字）
const isCodeValid = (code) => {
  if (!isNotEmpty(code)) return false
  const reg = /^\d{6}$/
  return reg.test(String(code).trim())
}

export { isEmail, isUsernameValid, isPasswordValid, isCodeValid }
