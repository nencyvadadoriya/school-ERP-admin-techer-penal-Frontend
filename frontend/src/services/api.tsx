import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9005/api';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  register: (data) => api.post('/admin/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login: (data) => api.post('/admin/login', data),
  forgotPassword: (data: { email: string }) => api.post('/admin/forgot-password', data),
  verifyOTP: (data: { email: string; otp: string; newPassword?: string }) => api.post('/admin/verify-otp', data),
  getAll: () => api.get('/admin'),
  getById: (id) => api.get(`/admin/${id}`),
  update: (id, data) => api.patch(`/admin/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateImage: (id, formData) => api.patch(`/admin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/admin/${id}`),
};

export const teacherAPI = {
  register: (data) => api.post('/teacher/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login: (data) => api.post('/teacher/login', data),
  forgotPassword: (data: { email: string }) => api.post('/teacher/forgot-password', data),
  verifyOTP: (data: { email: string; otp: string; newPassword?: string }) => api.post('/teacher/verify-otp', data),
  getAll: () => api.get('/teacher'),
  getById: (id) => api.get(`/teacher/${id}`),
  update: (id, data) => api.patch(`/teacher/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateImage: (id, formData) => api.patch(`/teacher/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/teacher/${id}`),
  assignSubjects: (id, data) => api.post(`/teacher/${id}/assign-subjects`, data),
};

export const studentAPI = {
  register: (data) => api.post('/student/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  bulkCreate: (data) => api.post('/student/bulk', data),
  login: (data) => api.post('/student/login', data),
  getAll: (params?: any) => api.get('/student', { params }),
  getById: (id) => api.get(`/student/${id}`),
  getNextRollNumber: (params: { std: string; class_name: string; shift?: string; medium?: string; stream?: string }) => 
    api.get('/student/get-next-roll-number', { params }),
  update: (id, data) => api.patch(`/student/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateImage: (id, formData) => api.patch(`/student/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/student/${id}`),
};

// Class API
export const classAPI = {
  create: (data) => api.post('/class', data),
  getAll: (params?: any) => api.get('/class', { params }),
  getById: (id) => api.get(`/class/${id}`),
  getByCode: (class_code) => api.get(`/class/code/${class_code}`),
  update: (id, data) => api.patch(`/class/${id}`, data),
  delete: (id) => api.delete(`/class/${id}`),
  assignTeacher: (id, data) => api.patch(`/class/${id}/assign-teacher`, data),
  updateClassTeacher: (id, data) => api.patch(`/class/${id}/class-teacher`, data),
};

export const subjectAPI = {
  create: (data) => api.post('/subject', data),
  bulkCreate: (data) => api.post('/subject/bulk', data),
  getAll: (params?: any) => api.get('/subject', { params }),
  getById: (id) => api.get(`/subject/${id}`),
  update: (id, data) => api.patch(`/subject/${id}`, data),
  delete: (id) => api.delete(`/subject/${id}`),
  getByClass: (params?: any) => api.get('/subject/by-class', { params }),
};

export const attendanceAPI = {
  mark: (data) => api.post('/attendance', data),
  getAll: (params?: any) => api.get('/attendance', { params }),
  getStudentSummary: (params?: any) => api.get('/attendance/student', { params }),
  getClassMonthSummary: (params?: any) => api.get('/attendance/class-summary', { params }),
  getDaily: (params?: any) => api.get('/attendance/daily', { params }),
  checkMissingAttendance: () => api.get('/attendance/check-missing-attendance'),
  checkMyMissingAttendance: () => api.get('/attendance/check-my-missing-attendance'),
  delete: (id) => api.delete(`/attendance/${id}`),
};

export const homeworkAPI = {
  create: (data) => api.post('/homework', data),
  getAll: (params?: any) => api.get('/homework', { params }),
  getById: (id) => api.get(`/homework/${id}`),
  checkMyHomework: () => api.get('/homework/check-my-homework'),
  update: (id, data) => api.patch(`/homework/${id}`, data),
  delete: (id) => api.delete(`/homework/${id}`),
};

export const examAPI = {
  create: (data) => api.post('/exam', data),
  getAll: (params?: any) => api.get('/exam', { params }),
  getById: (id) => api.get(`/exam/${id}`),
  update: (id, data) => api.patch(`/exam/${id}`, data),
  delete: (id) => api.delete(`/exam/${id}`),
  submitResult: (data) => api.post('/exam/results/submit', data),
  getResults: (params) => api.get('/exam/results/all', { params }),
};

export const feesAPI = {
  create: (data) => api.post('/fees', data, { headers: { 'X-Fees-Gate-Token': sessionStorage.getItem('fees_gate_token') || '' } }),
  getAll: (params?: any) => api.get('/fees', { params, headers: { 'X-Fees-Gate-Token': sessionStorage.getItem('fees_gate_token') || '' } }),
  getById: (id) => api.get(`/fees/${id}`, { headers: { 'X-Fees-Gate-Token': sessionStorage.getItem('fees_gate_token') || '' } }),
  update: (id, data) => api.patch(`/fees/${id}`, data, { headers: { 'X-Fees-Gate-Token': sessionStorage.getItem('fees_gate_token') || '' } }),
  delete: (id) => api.delete(`/fees/${id}`, { headers: { 'X-Fees-Gate-Token': sessionStorage.getItem('fees_gate_token') || '' } }),
  getSummary: () => api.get('/fees/summary', { headers: { 'X-Fees-Gate-Token': sessionStorage.getItem('fees_gate_token') || '' } }),
};

export const feesPageSecurityAPI = {
  status: () => api.get('/fees-page-security/status'),
  setPassword: (data: { password: string }) => api.post('/fees-page-security/set-password', data),
  verify: (data: { password: string }) => api.post('/fees-page-security/verify', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.post('/fees-page-security/change-password', data),
  requestReset: (data: { email: string }) => api.post('/fees-page-security/reset/request', data),
  confirmReset: (data: { email: string; code: string; newPassword: string }) => api.post('/fees-page-security/reset/confirm', data),
};

export const auditAPI = {
  getFees: (params?: any) => api.get('/audit/fees', { params }),
  recordFeesPageView: () => api.post('/audit/fees/view'),
};

export const noticeAPI = {
  create: (data) => api.post('/notice', data),
  getAll: (params?: any) => api.get('/notice', { params }),
  update: (id, data) => api.patch(`/notice/${id}`, data),
  delete: (id) => api.delete(`/notice/${id}`),
};

export const eventAPI = {
  create: (data) => api.post('/event', data),
  getAll: () => api.get('/event'),
  update: (id, data) => api.patch(`/event/${id}`, data),
  delete: (id) => api.delete(`/event/${id}`),
};

export const leaveAPI = {
  applyStudent: (data) => api.post('/leave/student', data),
  getStudentLeaves: (params?: any) => api.get('/leave/student', { params }),
  updateStudentLeave: (id, data) => api.patch(`/leave/student/${id}`, data),
  deleteStudentLeave: (id) => api.delete(`/leave/student/${id}`),
  applyTeacher: (data) => api.post('/leave/teacher', data),
  getTeacherLeaves: (params?: any) => api.get('/leave/teacher', { params }),
  updateTeacherLeave: (id, data) => api.patch(`/leave/teacher/${id}`, data),
  deleteTeacherLeave: (id) => api.delete(`/leave/teacher/${id}`),
};

export const timetableAPI = {
  save: (data) => api.post('/timetable', data),
  deleteEntry: (data) => api.delete('/timetable/entry', { data }),
  getAll: () => api.get('/timetable'),
  getByClass: (class_code) => api.get(`/timetable/${class_code}`),
};

export const shiftBreakTimeAPI = {
  upsert: (data: { shift: string; break_start_time: string; break_end_time: string }) => api.post('/shift-break-time', data),
  getAll: () => api.get('/shift-break-time'),
  getByShift: (shift: string) => api.get(`/shift-break-time/${shift}`),
};

export const dashboardAPI = {
  admin: () => api.get('/dashboard/admin'),
  teacher: () => api.get('/dashboard/teacher'),
  student: () => api.get('/dashboard/student'),
};

export default api;
