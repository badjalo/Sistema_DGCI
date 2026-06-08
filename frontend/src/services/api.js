import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // ✅ Enviar cookies automaticamente (httpOnly)
  withCredentials: true
});

// ✅ Interceptor para remover Content-Type quando FormData é enviado
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Deixar o navegador definir automaticamente multipart/form-data
    delete config.headers['Content-Type'];
  }
  return config;
});

// ✅ Remover tentativa de ler token de localStorage
// Token é agora um httpOnly cookie enviado automaticamente

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/me');

    // Only force-redirect on 401 for non-auth endpoints
    // (avoids redirect loop when login itself returns 401)
    if (error.response?.status === 401 && !isAuthEndpoint) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

