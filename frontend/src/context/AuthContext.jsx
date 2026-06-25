import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Token enviado via Authorization header (localStorage) ou httpOnly cookie
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        // Não autenticado - token expirado ou inválido
        setUser(null);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        // Guardar token em localStorage para funcionar em cross-domain
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        setUser(data.user);
        return { success: true, deve_mudar_senha: data.user?.deve_mudar_senha || false };
      }
      return { success: false };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar token do localStorage e cookie
      localStorage.removeItem('authToken');
      setUser(null);
      window.location.href = '/';
    }
  };

  // Chamado após o primeiro login mudar a senha com sucesso
  const markPasswordChanged = () => {
    setUser(prev => prev ? { ...prev, deve_mudar_senha: false } : prev);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.perfil === 'administrador') return true;

    const roleMap = {
      presidente: ['read'],
      auditor: ['read'],
      tesoureiro: ['financeiro', 'quotas', 'read'],
      secretario: ['membros', 'documentos', 'comunicados', 'read'],
      operador: ['read'],
      membro: ['transparencia', 'votacoes', 'dashboard:read'],
    };

    const perms = roleMap[user.perfil] || [];
    return perms.some(p => permission.includes(p) || p === 'read');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, hasPermission, markPasswordChanged }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
