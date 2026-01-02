// src/utils/api.js - COMPLETE WITH REAL-TIME ENDPOINTS
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
let socket = null;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased for large file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on signin page
      if (!window.location.pathname.includes('/signin')) {
        window.location.href = '/signin?session=expired';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      window.location.href = '/unauthorized';
    }
    
    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded:', error.response.data);
      // Could show a toast notification here
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config.url);
    }
    
    if (error.code === 'NETWORK_ERROR') {
      console.error('Network error - check connection');
    }
    
    return Promise.reject(error);
  }
);

// Socket.io initialization with reconnection
const initSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    
    socket = io(API_URL.replace('/api', ''), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Socket event listeners
    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });
  }
  return socket;
};

// Socket cleanup
const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Get socket instance
const getSocket = () => {
  if (!socket) {
    initSocket();
  }
  return socket;
};

// Real-time API functions
export const realtimeAPI = {
  // Get real-time stats
  getStats: () => api.get('/stats/realtime'),
  
  // Get live notifications
  getNotifications: (userId) => api.get(`/notifications/${userId}/live`),
  
  // Get unread notification count
  getUnreadCount: (userId) => api.get(`/notifications/${userId}/unread`),
  
  // Mark notification as read
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  
  // Mark all as read
  markAllAsRead: (userId) => api.put(`/notifications/${userId}/read-all`),
  
  // Subscribe to events
  subscribeToEvents: (callback) => {
    const socket = getSocket();
    socket.on('events-update', callback);
    return () => socket.off('events-update', callback);
  },
  
  // Subscribe to book updates
  subscribeToBooks: (callback) => {
    const socket = getSocket();
    socket.on('books-update', callback);
    return () => socket.off('books-update', callback);
  },
  
  // Subscribe to user-specific notifications
  subscribeToUserNotifications: (userId, callback) => {
    const socket = getSocket();
    const eventName = `user-notification-${userId}`;
    socket.on(eventName, callback);
    return () => socket.off(eventName, callback);
  },
  
  // Subscribe to system alerts
  subscribeToSystemAlerts: (callback) => {
    const socket = getSocket();
    socket.on('system-alert', callback);
    return () => socket.off('system-alert', callback);
  },
  
  // Join chat room
  joinChatRoom: (roomId) => {
    const socket = getSocket();
    socket.emit('join-room', roomId);
  },
  
  // Leave chat room
  leaveChatRoom: (roomId) => {
    const socket = getSocket();
    socket.emit('leave-room', roomId);
  },
  
  // Send chat message
  sendChatMessage: (roomId, message) => {
    const socket = getSocket();
    socket.emit('chat-message', { roomId, message });
  },
  
  // Upload with progress (enhanced)
  uploadWithProgress: (url, data, onProgress, onUploadComplete) => {
    return api.post(url, data, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    })
    .then(response => {
      if (onUploadComplete) onUploadComplete(response.data);
      return response;
    })
    .catch(error => {
      console.error('Upload error:', error);
      throw error;
    });
  },
  
  // Initialize socket connection
  connect: () => {
    return getSocket();
  },
  
  // Disconnect socket
  disconnect: () => {
    disconnectSocket();
  },
  
  // Get socket connection status
  getConnectionStatus: () => {
    return socket ? socket.connected : false;
  },
  
  // Emit custom event
  emitEvent: (eventName, data) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit(eventName, data);
    } else {
      console.warn('Socket not connected, cannot emit:', eventName);
    }
  }
};

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/signin', credentials),
  register: (userData) => api.post('/auth/register', userData),
  adminLogin: (credentials) => api.post('/auth/admin-login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (data) => api.put('/auth/change-password', data),
  validateSession: () => api.get('/auth/validate-session'),
};

// Books API
export const booksAPI = {
  getAll: (params) => api.get('/books/allbooks', { params }),
  getById: (id) => api.get(`/books/${id}`),
  getByIsbn: (isbn) => api.get(`/books/isbn/${isbn}`),
  add: (bookData) => api.post('/books/addbook', bookData),
  update: (id, bookData) => api.put(`/books/${id}`, bookData),
  delete: (id) => api.delete(`/books/${id}`),
  search: (query, params) => api.get(`/books/search?q=${query}`, { params }),
  filter: (filters) => api.get('/books/filter', { params: filters }),
  getPopular: (limit = 10) => api.get(`/books/popular?limit=${limit}`),
  getNewArrivals: (limit = 10) => api.get(`/books/new-arrivals?limit=${limit}`),
  getDigitalBooks: (limit = 20) => api.get(`/books/digital?limit=${limit}`),
  uploadCover: (id, formData) => api.post(`/books/${id}/cover`, formData),
  uploadPdf: (id, formData, onProgress) => 
    realtimeAPI.uploadWithProgress(`/books/${id}/pdf`, formData, onProgress),
  downloadPdf: (id) => api.get(`/books/${id}/pdf`, { responseType: 'blob' }),
  addReview: (id, review) => api.post(`/books/${id}/reviews`, review),
  getCategories: () => api.get('/books/categories'),
  getStats: () => api.get('/books/stats'),
};

// User API
export const userAPI = {
  getProfile: (id) => api.get(`/users/profile/${id}`),
  updateProfile: (id, data) => api.put(`/users/profile/${id}`, data),
  updateProfileImage: (id, formData) => api.post(`/users/${id}/profile-image`, formData),
  getBorrowHistory: (id) => api.get(`/users/${id}/borrow-history`),
  getCurrentBorrows: (id) => api.get(`/users/${id}/current-borrows`),
  getWishlist: (id) => api.get(`/users/${id}/wishlist`),
  addToWishlist: (id, bookId) => api.post(`/users/${id}/wishlist`, { bookId }),
  removeFromWishlist: (id, bookId) => api.delete(`/users/${id}/wishlist/${bookId}`),
  getNotifications: (id) => api.get(`/users/${id}/notifications`),
  getFines: (id) => api.get(`/users/${id}/fines`),
  payFine: (id, paymentData) => api.post(`/users/${id}/pay-fine`, paymentData),
  getAllUsers: (params) => api.get('/users/all', { params }),
  updateUserStatus: (id, statusData) => api.put(`/users/${id}/status`, statusData),
  getUserActivity: (id) => api.get(`/users/${id}/activity`),
};

// Transactions API
export const transactionsAPI = {
  issue: (data) => api.post('/transactions/issue', data),
  return: (data) => api.post('/transactions/return', data),
  renew: (data) => api.post('/transactions/renew', data),
  getAll: (params) => api.get('/transactions/all', { params }),
  getUserTransactions: (userId) => api.get(`/transactions/user/${userId}`),
  getOverdue: () => api.get('/transactions/overdue'),
  getStats: () => api.get('/transactions/stats'),
  exportToCSV: (params) => api.get('/transactions/export', { 
    params,
    responseType: 'blob'
  }),
};

// Events API
export const eventsAPI = {
  getAll: (params) => api.get('/events/allevents', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post('/events/create', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
  register: (data) => api.post('/events/register', data),
  cancelRegistration: (data) => api.post('/events/cancel-registration', data),
  getParticipants: (id) => api.get(`/events/${id}/participants`),
  getUpcoming: (limit = 10) => api.get('/events/upcoming', { params: { limit } }),
  getPast: (limit = 10) => api.get('/events/past', { params: { limit } }),
  uploadImage: (id, formData) => api.post(`/events/${id}/image`, formData),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getSystemHealth: () => api.get('/admin/system-health'),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  backupDatabase: () => api.get('/admin/backup', { responseType: 'blob' }),
  restoreDatabase: (formData) => api.post('/admin/restore', formData),
  sendBulkNotifications: (data) => api.post('/admin/bulk-notifications', data),
  generateReport: (type, params) => api.get(`/admin/reports/${type}`, { 
    params,
    responseType: 'blob'
  }),
};

// Analytics API
export const analyticsAPI = {
  getUsageStats: (period) => api.get(`/analytics/usage/${period}`),
  getPopularBooks: (period) => api.get(`/analytics/popular-books/${period}`),
  getUserActivity: (period) => api.get(`/analytics/user-activity/${period}`),
  getRevenue: (period) => api.get(`/analytics/revenue/${period}`),
  getEngagement: () => api.get('/analytics/engagement'),
};

// File Upload Helper
export const uploadFile = async (url, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
};

// Custom request with retry logic
export const requestWithRetry = async (requestFn, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Export default api instance
export default api;