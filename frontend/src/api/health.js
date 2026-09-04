import request from './request'

// 获取健康档案列表
export const getHealthProfiles = () => request.get('/health-profiles')
// 更新健康档案
export const updateHealthProfile = (memberId, data) =>
  request.put(`/health-profiles/${memberId}`, data)
