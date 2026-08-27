import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    return config
  },
  (err) => Promise.reject(err)
)

// 响应拦截器
instance.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && body.code === 200) {
      return body
    }
    return Promise.reject(new Error(body?.message || '请求失败'))
  },
  (err) => {
    const message = err.response?.data?.message || err.message || '服务异常，请稍后重试'
    return Promise.reject(new Error(message))
  }
)

export default instance
