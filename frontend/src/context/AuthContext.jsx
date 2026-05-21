import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          if (data.success) {
            setUser(data.data);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
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
