import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, CreditCard, DollarSign,
  FileText, MessageSquare, BarChart3, Building,
  Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import logo from '../assets/logo.jpeg';

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/membros',     icon: Users,           label: 'Membros' },
    ]
  },
  {
    label: 'Financeiro',
    items: [
      { path: '/quotas',      icon: CreditCard,  label: 'Quota e Fundo Social' },
      { path: '/financeiro',  icon: DollarSign,  label: 'Controlo Financeiro' },
      { path: '/relatorios',  icon: BarChart3,   label: 'Relatórios' },
    ]
  },
  {
    label: 'Organização',
    items: [
      { path: '/departamentos', icon: Building,      label: 'Departamentos' },
      { path: '/documentos',    icon: FileText,      label: 'Documentos' },
      { path: '/comunicados',   icon: MessageSquare, label: 'Comunicados' },
    ]
  },
  {
    label: 'Sistema',
    items: [
      { path: '/configuracoes', icon: Settings, label: 'Configurações' },
    ]
  },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? '72px' : '256px';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(9,14,30,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white shadow-lg"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        style={{
          width: sidebarWidth,
          background: 'var(--sidebar-bg)',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.3s',
          flexShrink: 0,
        }}
        className={`
          fixed lg:static top-0 left-0 h-screen z-40 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div
          className="flex items-center px-4 border-b"
          style={{ borderColor: 'var(--sidebar-border)', height: '64px', gap: '12px', overflow: 'hidden' }}
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
            {logo
              ? <img src={logo} alt="SF-DGCI" className="w-full h-full object-contain" />
              : <span className="text-white font-bold text-sm">SF</span>
            }
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate leading-tight">SF-DGCI</p>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>Sistema de Gestão</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-2">
              {!collapsed && (
                <p
                  className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}
                >
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-150 group overflow-hidden
                      ${isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white'
                      }
                    `}
                    style={{
                      background: isActive ? 'var(--sidebar-active)' : 'transparent',
                      ...(isActive ? { boxShadow: '0 4px 14px rgba(59,111,245,0.35)' } : {}),
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="font-medium text-sm truncate">{item.label}</span>
                    )}
                    {/* Tooltip on collapsed */}
                    {collapsed && (
                      <span
                        className="absolute left-full ml-3 px-2 py-1 text-xs font-semibold text-white rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity"
                        style={{ background: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                      >
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center mx-auto mb-2 w-8 h-8 rounded-lg transition-all hover:bg-white/10"
          style={{ color: 'var(--sidebar-text)' }}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* User section */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div
            className="flex items-center gap-3 p-2.5 rounded-lg mb-2"
            style={{ background: 'var(--sidebar-hover)', overflow: 'hidden' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}
            >
              {user?.nome?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.nome || 'Utilizador'}</p>
                <p className="text-xs capitalize truncate" style={{ color: 'var(--sidebar-text)' }}>{user?.perfil || 'admin'}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-400"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
