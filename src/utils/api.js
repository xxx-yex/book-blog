import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器 - 添加 token
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

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 如果是登录接口的401错误，不重定向，让登录组件自己处理
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      // 避免在登录页面重定向
      if (!window.location.pathname.includes('/admin')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// 认证相关
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (oldPassword, newPassword) => api.put('/auth/change-password', { oldPassword, newPassword }),
};

// 分类相关
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  batchDelete: (ids) => api.post('/categories/batch-delete', { ids }),
};

// 文章相关
export const articleAPI = {
  getAll: (params) => api.get('/articles', { params }),
  getById: (id) => api.get(`/articles/${id}`),
  create: (data) => api.post('/articles', data),
  update: (id, data) => api.put(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
  batchDelete: (ids) => api.post('/articles/batch-delete', { ids }),
  batchImport: (articles) => api.post('/articles/batch-import', { articles }),
  incrementViews: (id) => api.post(`/articles/${id}/views`),
  uploadImage: (formData) => {
    const token = localStorage.getItem('token');
    return api.post('/articles/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  },
};

// 相册相关
export const photoAPI = {
  getAll: () => api.get('/photos'),
  getById: (id) => api.get(`/photos/${id}`),
  upload: (formData) => {
    const token = localStorage.getItem('token');
    return api.post('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  },
  update: (id, data) => api.put(`/photos/${id}`, data),
  delete: (id) => api.delete(`/photos/${id}`),
  batchDelete: (ids) => api.post('/photos/batch-delete', { ids }),
};

// 首页相关
export const homeAPI = {
  get: () => api.get('/home'),
  update: (formData) => {
    // 使用 FormData 时，axios 会自动设置正确的 Content-Type（包括 boundary）
    // 不需要手动设置 Content-Type
    const token = localStorage.getItem('token');
    return api.put('/home', formData, {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    });
  },
};

// 书签相关
export const bookmarkAPI = {
  getAll: () => api.get('/bookmarks'),
  getCategories: () => api.get('/bookmarks/categories'),
  create: (data) => api.post('/bookmarks', data),
  update: (id, data) => api.put(`/bookmarks/${id}`, data),
  delete: (id) => api.delete(`/bookmarks/${id}`),
};

// 时间事件相关
export const eventAPI = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  batchDelete: (ids) => api.post('/events/batch-delete', { ids }),
};

export default api;

