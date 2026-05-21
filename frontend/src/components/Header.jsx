import React from 'react';
import logo from '../assets/logo.jpeg';
import { Bell, Search, Settings, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {logo ? (
              <img src={logo} alt="SF-DGCI" className="h-10 w-10 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
                SF
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Sindicato dos Funcionários da DGCI — Guiné-Bissau</h2>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <button className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Settings */}
          <button className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings size={20} />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.nome?.split(' ')[0]}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.perfil}</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-semibold text-sm hover:shadow-lg transition-all hover:from-amber-500 hover:to-orange-600">
              {user?.nome?.charAt(0) || 'U'}
            </button>
          </div>

          {/* More Options */}
          <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
