import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  getMyLabels: () => axios.get('/api/usps-labels/employee', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  getMyDashboard: () => axios.get('/api/usps-labels/employee/dashboard', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  addLabel: (formData) => axios.post('/api/usps-labels/employee', formData, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}`, 'Content-Type': 'multipart/form-data' } }),
  updateLabel: (id, formData) => axios.put(`/api/usps-labels/employee/${id}`, formData, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}`, 'Content-Type': 'multipart/form-data' } }),
  deleteLabel: (id) => axios.delete(`/api/usps-labels/employee/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  // Admin endpoints
  getAll: () => axios.get('/api/usps-labels/admin'),
  getAdminDashboard: () => axios.get('/api/usps-labels/admin/dashboard'),
  updateAdminLabel: (id, data) => axios.put(`/api/usps-labels/admin/${id}`, data),
  deleteAdminLabel: (id) => axios.delete(`/api/usps-labels/admin/${id}`),
  // File
  getPaymentScreenshot: (filename) => `/api/usps-labels/payment-screenshot/${filename}`
};

export const uspsGoalsAPI = {
  // Employee endpoints
  getCurrentGoal: () => axios.get('/api/usps-goals/employee/current', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  getGoalHistory: () => axios.get('/api/usps-goals/employee/history', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  updateCurrentGoal: (data) => axios.put('/api/usps-goals/employee/current', data, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  // Admin endpoints
  getAdminCurrent: () => axios.get('/api/usps-goals/admin/current'),
  getAdminAnalytics: () => axios.get('/api/usps-goals/admin/analytics'),
  setEmployeeGoal: (employeeId, data) => axios.post(`/api/usps-goals/admin/employee/${employeeId}`, data),
  updateAdminGoal: (goalId, data) => axios.put(`/api/usps-goals/admin/employee/${goalId}`, data),
  deleteGoal: (goalId) => axios.delete(`/api/usps-goals/admin/employee/${goalId}`),
  getEmployeeGoalHistory: (employeeId) => axios.get(`/api/usps-goals/admin/employee/${employeeId}/history`),
  updateAllProgress: () => axios.post('/api/usps-goals/update-progress')
};

export const tasksAPI = {
  getAll: () => axios.get('/api/tasks', { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  create: (data) => axios.post('/api/tasks', data, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  update: (id, data) => axios.put(`/api/tasks/${id}`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  delete: (id) => axios.delete(`/api/tasks/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  move: (id, status) => axios.patch(`/api/tasks/${id}/move`, { status }, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  addComment: (id, data) => axios.post(`/api/tasks/${id}/comments`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
  deleteComment: (id, commentId) => axios.delete(`/api/tasks/${id}/comments/${commentId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` } }),
};

export default api; 