import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://gamma-management-system-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Employee API calls
export const employeeAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  search: (query) => api.get(`/employees/search/${query}`),
  getProfile: () => api.get('/employees/profile', { 
    headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } 
  }),
};

// Attendance API calls
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (data) => api.post('/attendance/checkout', data),
  timeToGo: () => api.post('/attendance/time-to-go'),
  employeeTimeToGo: (data) => api.post('/attendance/employee-time-to-go', data),
  startShift: () => api.post('/attendance/start-shift'),
  getShiftStatus: () => api.get('/attendance/shift-status'),
  getEmployeeShiftStatus: (name, email) => api.get('/attendance/employee-shift-status', {
    params: { name, email }
  }),
  getEmployeeShiftStatusById: (employeeId) => api.get('/attendance/employee-shift-status-by-id', {
    params: { employeeId }
  }),
  getTodayCheckIns: (date) => api.get('/attendance/today-checkins', {
    params: { date }
  }),
  getStatus: (employeeId) => api.get(`/attendance/status/${employeeId}`),
  getHistory: (employeeId, startDate, endDate) => 
    api.get(`/attendance/history/${employeeId}`, {
      params: { startDate, endDate }
    }),
};

// Analytics API calls
export const analyticsAPI = {
  getTotalHours: (startDate, endDate) => 
    api.get('/analytics/total-hours', {
      params: { startDate, endDate }
    }),
  getTopPunctual: (startDate, endDate) => 
    api.get('/analytics/top-punctual', {
      params: { startDate, endDate }
    }),
  getTopHardworking: (startDate, endDate) => 
    api.get('/analytics/top-hardworking', {
      params: { startDate, endDate }
    }),
  getSummary: () => api.get('/analytics/summary'),
  getTrends: () => api.get('/analytics/trends'),
};

// Shifts API calls
export const shiftAPI = {
  getAll: () => api.get('/shifts'),
  getActive: () => api.get('/shifts/active'),
  getById: (id) => api.get(`/shifts/${id}`),
  create: (data) => api.post('/shifts', data),
  update: (id, data) => api.put(`/shifts/${id}`, data),
  delete: (id) => api.delete(`/shifts/${id}`),
  assignEmployees: (shiftId, employeeIds) => 
    api.post(`/shifts/${shiftId}/assign-employees`, { employeeIds }),
  unassignEmployees: (shiftId, employeeIds) => 
    api.post(`/shifts/${shiftId}/unassign-employees`, { employeeIds }),
  getUnassignedEmployees: () => api.get('/shifts/unassigned-employees'),
  getStats: (id) => api.get(`/shifts/${id}/stats`),
};

// Health check
export const healthCheck = () => api.get('/health');

export const uspsLabelsAPI = {
  // Employee endpoints
  getMyLabels: () => api.get('/usps-labels/employee', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  getMyDashboard: () => api.get('/usps-labels/employee/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  addLabel: (formData) => api.post('/usps-labels/employee', formData, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}`, 'Content-Type': 'multipart/form-data' } }),
  updateLabel: (id, formData) => api.put(`/usps-labels/employee/${id}`, formData, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}`, 'Content-Type': 'multipart/form-data' } }),
  deleteLabel: (id) => api.delete(`/usps-labels/employee/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  // Admin endpoints
  getAll: () => api.get('/usps-labels/admin'),
  getAdminDashboard: () => api.get('/usps-labels/admin/dashboard'),
  updateAdminLabel: (id, data) => api.put(`/usps-labels/admin/${id}`, data),
  deleteAdminLabel: (id) => api.delete(`/usps-labels/admin/${id}`),
  // File
  getPaymentScreenshot: (filename) => `${API_BASE_URL}/usps-labels/payment-screenshot/${filename}`
};

export const uspsGoalsAPI = {
  // Employee endpoints
  getCurrentGoal: () => api.get('/usps-goals/employee/current', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  getGoalHistory: () => api.get('/usps-goals/employee/history', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  updateCurrentGoal: (data) => api.put('/usps-goals/employee/current', data, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  // Admin endpoints
  getAdminCurrent: () => api.get('/usps-goals/admin/current'),
  getAdminAnalytics: () => api.get('/usps-goals/admin/analytics'),
  setEmployeeGoal: (employeeId, data) => api.post(`/usps-goals/admin/employee/${employeeId}`, data),
  updateAdminGoal: (goalId, data) => api.put(`/usps-goals/admin/employee/${goalId}`, data),
  deleteGoal: (goalId) => api.delete(`/usps-goals/admin/employee/${goalId}`),
  getEmployeeGoalHistory: (employeeId) => api.get(`/usps-goals/admin/employee/${employeeId}/history`),
  updateAllProgress: () => api.post('/usps-goals/update-progress')
};

export const tasksAPI = {
  getAll: () => api.get('/tasks', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  create: (data) => api.post('/tasks', data, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  update: (id, data) => api.put(`/tasks/${id}`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  delete: (id) => api.delete(`/tasks/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  move: (id, status) => api.patch(`/tasks/${id}/move`, { status }, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  deleteComment: (id, commentId) => api.delete(`/tasks/${id}/comments/${commentId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
};

// Admin Settings API for cloud-based cost per label and expenses
export const adminSettingsAPI = {
  get: (month) =>
    fetch(`/api/admin-settings/${month}`).then(res => res.json()),
  save: (month, data) =>
    fetch(`/api/admin-settings/${month}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json())
};

export default api; 