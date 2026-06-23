import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sistema-dgci.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials envia cookies — necessário para httpOnly cookie funcionar
  withCredentials: true,
});

// ✅ Interceptor de REQUEST: adicionar token JWT do localStorage se disponível
// Isto serve como fallback para quando o cookie cross-domain é bloqueado pelo browser
api.interceptors.request.use((config) => {
  // Remover Content-Type para FormData (o browser define automaticamente)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  // Adicionar Authorization header se houver token no localStorage
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// ✅ Interceptor de RESPONSE: tratar erros 401
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
  return apiUrl.replace(/\/api\/?$/, '');
};

export default api;
