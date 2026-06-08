import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ✅ Token é enviado automaticamente via httpOnly cookie
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        // Não autenticado - token expirado ou inválido
        setUser(null);
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
        // ✅ Token é enviado automaticamente via httpOnly cookie pelo servidor
        // Não armazenamos nada em localStorage
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // ✅ Cookie httpOnly é automaticamente limpo pelo servidor
      setUser(null);
      window.location.href = '/';
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    // Administrador tem acesso a tudo
    if (user.perfil === 'administrador') return true;

    // Simplificando permissões no frontend (verificação real no backend)
    const roleMap = {
      // Presidente e auditor: apenas consulta — sem criação, edição ou eliminação
      presidente: ['read'],
      auditor: ['read'],
      // Restantes perfis com as suas permissões operacionais
      tesoureiro: ['financeiro', 'quotas', 'read'],
      secretario: ['membros', 'documentos', 'comunicados', 'read'],
      operador: ['read'],
    };

    const perms = roleMap[user.perfil] || [];
    return perms.some(p => permission.includes(p) || p === 'read');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
