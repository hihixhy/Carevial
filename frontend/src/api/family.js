import request from './request'

// 获取用户家庭成员列表
export const getFamilyMembers = () => request.get('/family-members')
// 新增家庭成员
export const addFamilyMember = (data) => request.post('/family-members', data)
// 更新家庭成员
export const updateFamilyMember = (id, data) => request.put(`/family-members/${id}`, data)
// 删除家庭成员
export const deleteFamilyMember = (id) => request.delete(`/family-members/${id}`)
