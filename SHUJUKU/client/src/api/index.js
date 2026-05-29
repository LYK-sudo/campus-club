import request from '@/utils/request'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  logout: () => request.post('/auth/logout'),
  getMe: () => request.get('/auth/me'),
  updateProfile: (data) => request.put('/auth/profile', data),
  changePassword: (data) => request.put('/auth/password', data)
}

export const userApi = {
  getList: (params) => request.get('/users', { params }),
  getById: (id) => request.get(`/users/${id}`),
  create: (data) => request.post('/users', data),
  batchImport: (data) => request.post('/users/batch', data),
  update: (id, data) => request.put(`/users/${id}`, data),
  toggleBan: (id, data) => request.put(`/users/${id}/ban`, data),
  delete: (id) => request.delete(`/users/${id}`)
}

export const clubApi = {
  getList: (params) => request.get('/clubs', { params }),
  getById: (id) => request.get(`/clubs/${id}`),
  create: (data) => request.post('/clubs', data),
  update: (id, data) => request.put(`/clubs/${id}`, data),
  updateStatus: (id, data) => request.put(`/clubs/${id}/status`, data),
  getMembers: (id, params) => request.get(`/clubs/${id}/members`, { params }),
  addMember: (id, data) => request.post(`/clubs/${id}/members`, data),
  updateMemberRole: (id, userId, data) => request.put(`/clubs/${id}/members/${userId}`, data),
  removeMember: (id, userId) => request.delete(`/clubs/${id}/members/${userId}`),
  getStats: (id) => request.get(`/clubs/${id}/stats`)
}

export const activityApi = {
  getList: (params) => request.get('/activities', { params }),
  getById: (id) => request.get(`/activities/${id}`),
  create: (data) => request.post('/activities', data),
  update: (id, data) => request.put(`/activities/${id}`, data),
  delete: (id) => request.delete(`/activities/${id}`),
  submit: (id) => request.post(`/activities/${id}/submit`),
  cancel: (id, data) => request.post(`/activities/${id}/cancel`, data),
  register: (id) => request.post(`/activities/${id}/register`),
  cancelRegister: (id) => request.delete(`/activities/${id}/register`),
  getRegistrations: (id) => request.get(`/activities/${id}/registrations`),
  getCheckinQRCode: (id) => request.get(`/activities/${id}/checkin/qrcode`),
  checkin: (id, data) => request.post(`/activities/${id}/checkin`, data),
  getCheckinRecords: (id) => request.get(`/activities/${id}/checkin/records`),
  complete: (id) => request.post(`/activities/${id}/complete`)
}

export const approvalApi = {
  getList: (params) => request.get('/approvals', { params }),
  getById: (id) => request.get(`/approvals/${id}`),
  approve: (id) => request.post(`/approvals/${id}/approve`),
  reject: (id, data) => request.post(`/approvals/${id}/reject`, data)
}

export const fundApi = {
  getList: (params) => request.get('/funds', { params }),
  create: (data) => request.post('/funds', data),
  getSummary: (params) => request.get('/funds/summary', { params })
}

export const equipmentApi = {
  getList: (params) => request.get('/equipment', { params }),
  create: (data) => request.post('/equipment', data),
  update: (id, data) => request.put(`/equipment/${id}`, data),
  getBorrows: (params) => request.get('/equipment/borrows', { params }),
  borrow: (data) => request.post('/equipment/borrow', data),
  return: (id, data) => request.post(`/equipment/return/${id}`, data)
}

export const creditApi = {
  getList: (params) => request.get('/credits', { params }),
  getSummary: (userId) => request.get(`/credits/summary/${userId}`),
  add: (data) => request.post('/credits/add', data)
}

export const dashboardApi = {
  getStats: () => request.get('/dashboard/stats')
}

export const uploadApi = {
  upload: (type, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`/upload/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}
