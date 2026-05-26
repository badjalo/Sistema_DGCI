import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const clearStoredToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          if (data.success) {
            setUser(data.data);
          }
        } catch (error) {
          clearStoredToken();
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password, remember = false) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      if (remember) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', email);
        sessionStorage.removeItem('token');
      } else {
        sessionStorage.setItem('token', data.token);
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('token');
      }
      setUser(data.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    clearStoredToken();
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberedEmail');
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    // Administrador tem acesso a tudo
    if (user.perfil === 'administrador') return true;

    // Simplificando permissões no frontend (verificação real no backend)
    const roleMap = {
      presidente: ['read', 'create', 'update', 'delete'],
      tesoureiro: ['financeiro', 'quotas', 'read'],
      secretario: ['membros', 'documentos', 'read'],
      operador: ['read'],
      auditor: ['read']
    };

    const perms = roleMap[user.perfil] || [];
    return perms.some(p => permission.includes(p) || p === 'read');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
