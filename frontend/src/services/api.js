import axios from 'axios';

// Em produção com URL relativa (/api), o axios usa o mesmo domínio automaticamente
// Em desenvolvimento, usa o localhost:5000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor de REQUEST: adicionar token JWT do localStorage se disponível
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// Interceptor de RESPONSE: tratar erros 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/me');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getBackendUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Se for caminho relativo (/api), usar a origem do browser
  if (apiUrl.startsWith('/')) {
    return window.location.origin;
  }
  return apiUrl.replace(/\/api\/?$/, '');
};

export default api;
