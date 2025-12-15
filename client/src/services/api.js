import axios from 'axios'

// Use environment variable for API URL, fallback to localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

export const productsAPI = {
  create: (data) => api.post('/products', data),
  getAll: (page = 1, limit = 10, search = '') => api.get('/products', { params: { page, limit, search } }),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getDemand: () => api.get('/products/demand'),
  exportCSV: async () => {
    const response = await productsAPI.getAll(1, 10000);
    return response.data.data;
  }
}

export const customersAPI = {
  create: (data) => api.post('/customers', data),
  getAll: (page = 1, limit = 10) => api.get('/customers', { params: { page, limit } }),
  getById: (id) => api.get(`/customers/${id}`),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getPurchaseHistory: (id) => api.get(`/customers/${id}/purchase-history`),
}

export const salesAPI = {
  create: (data) => api.post('/sales', data),
  getAll: (page = 1, limit = 10) => api.get('/sales', { params: { page, limit } }),
  getById: (id) => api.get(`/sales/${id}`),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  exportCSV: async () => {
    const response = await salesAPI.getAll(1, 10000);
    return response.data.data;
  }
}

export const invoicesAPI = {
  generate: (data) => api.post('/invoices/generate', data),
  getAll: (page = 1, limit = 10) => api.get('/invoices', { params: { page, limit } }),
  getById: (id) => api.get(`/invoices/${id}`),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  download: (id) => window.open(`${API_BASE_URL}/invoices/${id}/download`, '_blank'),
  exportCSV: async () => {
    const response = await invoicesAPI.getAll(1, 10000);
    return response.data.data;
  }
}

export const reportsAPI = {
  salesSummary: () => api.get('/reports/sales-summary'),
  stockStatus: () => api.get('/reports/stock-status'),
  lowStock: () => api.get('/reports/low-stock'),
  salesTrend: () => api.get('/reports/sales-trend'),
  dailyAnalytics: () => api.get('/reports/analytics/daily'),
  periodAnalytics: (period) => api.get('/reports/analytics/period', { params: { period } }),
  profitAnalytics: (period) => api.get('/reports/profit-analytics', { params: { period } }),
  topProducts: () => api.get('/reports/top-products'),
  productDemand: () => api.get('/products/demand'),
}

export const usersAPI = {
  getAll: () => api.get('/users'),
  updateRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
  delete: (userId) => api.delete(`/users/${userId}`),
  changePassword: (userId, newPassword) => api.put(`/users/${userId}/password`, { newPassword }),
  changeOwnPassword: (currentPassword, newPassword) => api.put('/users/change-password', { currentPassword, newPassword }),
  uploadProfilePicture: (formData) => api.post('/users/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProfilePicture: () => api.delete('/users/profile-picture'),
  getProfilePicture: (userId) => api.get(`/users/${userId}/profile-picture`),
}

export const returnsAPI = {
  create: (data) => api.post('/returns', data),
  getAll: (page = 1, limit = 10, status = '') => 
    api.get('/returns', { params: { page, limit, status } }),
  getById: (id) => api.get(`/returns/${id}`),
  approve: (id) => api.put(`/returns/${id}/approve`),
  reject: (id, rejection_reason) => 
    api.put(`/returns/${id}/reject`, { rejection_reason }),
  delete: (id) => api.delete(`/returns/${id}`),
}

export const backupAPI = {
  create: () => api.post('/backup/create'),
  getAll: () => api.get('/backup'),
  restore: (backup_name) => api.post('/backup/restore', { backup_name }),
  download: (backup_name) => api.get(`/backup/download/${backup_name}`, { responseType: 'blob' }),
  delete: (backup_name) => api.delete(`/backup/${backup_name}`),
}

// CSV Export helper
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default api
