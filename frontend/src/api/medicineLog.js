import request from './request'

// 获取某日打卡列表
export const getDayLogs = (date, config = {}) =>
  request.get('/medicine-logs', { params: { date }, ...config })
// 打卡
export const addLog = (data) => request.post('/medicine-logs', data)
// 取消打卡
export const deleteLog = (id) => request.delete(`/medicine-logs/${id}`)
