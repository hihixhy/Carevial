import request from './request'

// 获取提醒列表
export const getReminders = () => request.get('/reminders')
// 获取药品提醒列表
export const getRemindersByMedicine = (medicineId) =>
  request.get(`/reminders/medicine/${medicineId}`)
// 添加提醒
export const addReminder = (data) => request.post('/reminders', data)
// 更新提醒
export const updateReminder = (id, data) => request.put(`/reminders/${id}`, data)
// 删除提醒
export const deleteReminder = (id) => request.delete(`/reminders/${id}`)
