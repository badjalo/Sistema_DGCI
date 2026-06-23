import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Moon, Sun, Menu, ChevronDown, LogOut, Settings, User, Check, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import api from '../services/api';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  /* Fetch notifications */
  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notificacoes');
      if (res.data.success) {
        setNotifs(res.data.data || []);
        setNaoLidas(res.data.nao_lidas || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  };

  /* Poll notifications every 30s when logged in */
  useEffect(() => {
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  /* Mark single notification as read and navigate */
  const handleNotifClick = async (n) => {
    try {
      if (!n.lida) {
        await api.put(`/notificacoes/${n.id}/ler`);
        fetchNotifs();
      }
      if (n.link) navigate(n.link);
      setShowNotif(false);
    } catch (err) {
      console.error('Erro ao ler notificação:', err);
    }
  };

  /* Mark all as read */
  const handleLerTodas = async () => {
    try {
      await api.put('/notificacoes/ler-todas');
      fetchNotifs();
    } catch (err) {
      console.error('Erro ao ler todas as notificações:', err);
    }
  };

  /* Apply dark mode */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  /* Close menus on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6"
      style={{
        height: '64px',
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--header-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        gap: '1rem',
      }}
    >
      {/* Left — Mobile toggle + Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-2)] transition-all hover:scale-110 active:scale-90"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--surface-2)', boxShadow: 'var(--shadow-sm)' }}
          >
            {logo
              ? <img src={logo} alt="SF-DGCI" className="w-full h-full object-contain" />
              : <span className="font-bold text-blue-700 text-xs">SF</span>
            }
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-1)' }}>SF-DGCI</p>
            <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>Guiné-Bissau</p>
          </div>
        </div>
      </div>

      {/* Center — Search */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div className="topbar-search">
          <Search size={15} />
          <input type="text" placeholder="Pesquisar no sistema..." />
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg transition-all hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:scale-110 active:scale-90"
          title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          style={{ transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          <span
            style={{
              display: 'inline-flex',
              transform: darkMode ? 'rotate(0deg)' : 'rotate(-30deg)',
              transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg transition-all hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:scale-110 active:scale-90"
            title="Notificações"
            style={{ transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes slow-shake {
                0%, 100% { transform: rotate(0deg); }
                10%, 30%, 50%, 70%, 90% { transform: rotate(8deg); }
                20%, 40%, 60%, 80% { transform: rotate(-8deg); }
              }
              .bell-alert {
                animation: slow-shake 1.8s ease-in-out infinite;
                transform-origin: top center;
              }
              @keyframes pulse-ring {
                0% { transform: scale(0.95); opacity: 1; }
                50% { transform: scale(1.3); opacity: 0.5; }
                100% { transform: scale(0.95); opacity: 1; }
              }
              .notif-dot-pulse {
                animation: pulse-ring 2s infinite;
              }
            `}} />
            <Bell size={18} className={naoLidas > 0 ? "bell-alert text-yellow-500" : ""} />
            {naoLidas > 0 && (
              <>
                <span
                  className="notif-dot absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full notif-dot-pulse"
                  style={{ background: '#ef4444', boxShadow: '0 0 0 2px var(--header-bg)', opacity: 0.8 }}
                />
                <span
                  className="notif-dot absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#ef4444', boxShadow: '0 0 0 2px var(--header-bg)' }}
                />
              </>
            )}
          </button>

          {showNotif && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-50 border shadow-2xl"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                animation: 'slideInDown 0.2s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Notificações</p>
                {naoLidas > 0 && (
                  <button
                    onClick={handleLerTodas}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
                  >
                    <Check size={12} /> Marcar como lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y" style={{ divideColor: 'var(--border)' }}>
                {notifs.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-3)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sem notificações recentes</p>
                  </div>
                ) : (
                  notifs.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`p-3.5 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer flex gap-3 relative ${
                        !n.lida ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {!n.lida && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${!n.lida ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-1)]'}`}>
                          {n.titulo}
                        </p>
                        <p className="text-[11px] mt-0.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                          {n.mensagem}
                        </p>
                        <p className="text-[9px] mt-1.5 flex items-center gap-1 opacity-60" style={{ color: 'var(--text-3)' }}>
                          <Clock size={10} />
                          {new Date(n.criado_em).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-[var(--surface-hover)] active:scale-95"
            style={{ transition: 'all 0.15s ease' }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
                }}
              >
                {user?.nome?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-1)' }}>
                {user?.nome?.split(' ')[0] || 'Utilizador'}
              </p>
              <p className="text-[10px] capitalize" style={{ color: 'var(--text-3)' }}>
                {user?.perfil || 'admin'}
              </p>
            </div>
            <ChevronDown
              size={14}
              className="hidden sm:block"
              style={{
                color: 'var(--text-3)',
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xl)',
                animation: 'slideInDown 0.2s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div
                className="px-4 py-3 border-b"
                style={{
                  borderColor: 'var(--border)',
                  background: 'linear-gradient(135deg, var(--primary-light), transparent)',
                }}
              >
                <div className="flex items-center gap-3 mb-1">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                    >
                      {user?.nome?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{user?.nome}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="py-1.5">
                <button
                  onClick={() => { navigate('/perfil'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-[var(--surface-hover)] active:scale-98"
                  style={{ color: 'var(--text-2)' }}
                >
                  <User size={15} />
                  O Meu Perfil
                </button>
                <button
                  onClick={() => { navigate('/configuracoes'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-[var(--surface-hover)] active:scale-98"
                  style={{ color: 'var(--text-2)' }}
                >
                  <Settings size={15} />
                  Configurações
                </button>
                <button
                  onClick={() => { logout(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-red-50 hover:text-red-600"
                  style={{ color: 'var(--text-2)' }}
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
