import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, CreditCard, DollarSign,
  FileText, MessageSquare, BarChart3, Building,
  Settings, LogOut, ChevronLeft, ChevronRight, Landmark, Inbox, ShieldCheck, Vote
} from 'lucide-react';
import logo from '../assets/logo.png';

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/membros',     icon: Users,           label: 'Membros', requiredPermission: 'membros' },
      { path: '/votacoes',    icon: Vote,            label: 'Votações & Sondagens', requiredPermission: 'votacoes' },
    ]
  },
  {
    label: 'Financeiro',
    items: [
      { path: '/quotas',      icon: CreditCard,  label: 'Quota e Fundo Social', requiredPermission: 'quotas' },
      { path: '/financeiro',  icon: DollarSign,  label: 'Controlo Financeiro', requiredPermission: 'financeiro' },
      { path: '/transparencia', icon: Landmark,    label: 'Transparência', requiredPermission: 'transparencia' },
      { path: '/relatorios',  icon: BarChart3,   label: 'Relatórios', requiredPermission: 'financeiro' },
    ]
  },
  {
    label: 'Organização',
    items: [
      { path: '/departamentos',   icon: Building,      label: 'Departamentos', requiredPermission: 'membros' },
      { path: '/documentos',      icon: FileText,      label: 'Documentos', requiredPermission: 'documentos' },
      { path: '/comunicados',     icon: MessageSquare, label: 'Comunicados', requiredPermission: 'comunicados' },
      { path: '/sindicato-admin', icon: Landmark,      label: 'O Sindicato', requiredPermission: 'read' },
      { path: '/mensagens',       icon: Inbox,         label: 'Mensagens', requiredPermission: 'comunicados' },
    ]
  },
  {
    label: 'Sistema',
    items: [
      { path: '/utilizadores', icon: Users,       label: 'Utilizadores', adminOnly: true },
      { path: '/auditoria',    icon: ShieldCheck, label: 'Auditoria',    adminOnly: true },
      { path: '/configuracoes', icon: Settings,   label: 'Configurações', requiredPermission: 'read' },
    ]
  },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? '72px' : '256px';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{
            background: 'rgba(9,14,30,0.65)',
            backdropFilter: 'blur(6px)',
            animation: 'backdropIn 0.2s ease-out',
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white shadow-lg transition-transform active:scale-90"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        style={{
          width: sidebarWidth,
          background: 'var(--sidebar-bg)',
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          flexShrink: 0,
          borderRight: '1px solid var(--sidebar-border)',
        }}
        className={`
          fixed lg:static top-0 left-0 h-screen z-40 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div
          className="flex items-center px-4 border-b"
          style={{
            borderColor: 'var(--sidebar-border)',
            height: '64px',
            gap: '12px',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
          }}
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s',
            }}
          >
            {logo
              ? <img src={logo} alt="SF-DGCI" className="w-full h-full object-contain" />
              : <span className="text-white font-bold text-sm">SF</span>
            }
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0" style={{ animation: 'slideInRight 0.25s ease-out' }}>
              <p className="font-bold text-white text-sm truncate leading-tight">SF-DGCI</p>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>Sistema de Gestão</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuGroups.map((group, gi) => (
            <div key={group.label} className="mb-3">
              {!collapsed && (
                <p
                  className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    color: 'var(--sidebar-text)',
                    opacity: 0.4,
                    letterSpacing: '0.12em',
                  }}
                >
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item, ii) => {
                  if (item.adminOnly && user?.perfil !== 'administrador') return null;
                  if (item.requiredPermission && !hasPermission(item.requiredPermission)) return null;
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
                        group overflow-hidden select-none
                        ${isActive
                          ? 'text-white'
                          : 'hover:text-white'
                        }
                      `}
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, var(--sidebar-active), rgba(59,111,245,0.8))'
                          : 'transparent',
                        boxShadow: isActive ? '0 4px 16px rgba(59,111,245,0.3)' : 'none',
                        color: isActive ? '#fff' : 'var(--sidebar-text)',
                        transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s',
                        transform: 'translateX(0)',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--sidebar-hover)';
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--sidebar-text)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      {/* Active left bar */}
                      {isActive && (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                          style={{
                            background: 'rgba(255,255,255,0.6)',
                            animation: 'scaleIn 0.2s ease-out',
                          }}
                        />
                      )}

                      <Icon
                        size={18}
                        className="flex-shrink-0"
                        style={{ transition: 'transform 0.2s' }}
                      />
                      {!collapsed && (
                        <span className="font-medium text-sm truncate">{item.label}</span>
                      )}

                      {/* Tooltip on collapsed */}
                      {collapsed && (
                        <span
                          className="absolute left-full ml-3 px-2.5 py-1.5 text-xs font-semibold text-white rounded-lg pointer-events-none whitespace-nowrap z-50"
                          style={{
                            background: '#1e293b',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            opacity: 0,
                            transform: 'translateX(-4px)',
                            transition: 'opacity 0.15s, transform 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          {item.label}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center mx-auto mb-2 w-8 h-8 rounded-lg transition-all hover:bg-white/10 active:scale-90"
          style={{ color: 'var(--sidebar-text)' }}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <span
            style={{
              display: 'inline-flex',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          >
            <ChevronRight size={16} />
          </span>
        </button>

        {/* User section */}
        <div
          className="p-3 border-t"
          style={{
            borderColor: 'var(--sidebar-border)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <Link
            to="/perfil"
            className="flex items-center gap-3 p-2.5 rounded-xl mb-2 hover:bg-white/[0.08] transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 text-white"
                style={{
                  background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
                }}
              >
                {user?.nome?.charAt(0) || 'U'}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.nome || 'Utilizador'}</p>
                <p className="text-xs capitalize truncate" style={{ color: 'var(--sidebar-text)' }}>{user?.perfil || 'admin'}</p>
              </div>
            )}
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/15 hover:text-red-400 active:scale-95"
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
