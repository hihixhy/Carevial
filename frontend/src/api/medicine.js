import request from './request'

// 获取用户药品列表
export const getMedicines = () => request.get('/medicines')
// 获取药品详情
export const getMedicine = (id) => request.get(`/medicines/${id}`)
// 添加药品
export const addMedicine = (data) => request.post('/medicines', data)
// 更新药品
export const updateMedicine = (id, data) => request.put(`/medicines/${id}`, data)
// 删除药品
export const deleteMedicine = (id) => request.delete(`/medicines/${id}`)
