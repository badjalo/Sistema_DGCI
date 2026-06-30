import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Lock, Moon, Sun } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../services/api';

const PublicNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [configs, setConfigs] = useState({
    sigla: 'SF-DGCI'
  });
  const currentPath = window.location.pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    api.get('/configuracoes/public')
      .then(res => {
        if (res.data && res.data.success) {
          setConfigs(prev => ({ ...prev, ...res.data.data }));
        }
      })
      .catch(err => console.error('Erro ao buscar configuracoes publicas na navbar:', err));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const navLinks = [
    { label: 'Início',      to: '/' },
    { label: 'O Sindicato', to: '/sindicato' },
    { label: 'Notícias',    to: '/noticias' },
    { label: 'Documentos',  to: '/documentos-publicos' },
    { label: 'Contacto',    to: '/contacto' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-[#161b27]/95 shadow-md py-2 backdrop-blur-md'
          : 'bg-white/95 dark:bg-[#161b27]/95 py-3 border-b border-gray-100 dark:border-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="SF-DGCI Logo" className="w-11 h-11 rounded-full object-cover ring-2 ring-yellow-400 shadow" />
            <div className="leading-tight">
              <p className="text-sm font-black text-[#1a2f5e] dark:text-white tracking-wide">{configs?.sigla || 'SF-DGCI'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Sistema de Gestão Sindical</p>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={`text-sm font-semibold transition-colors duration-200 px-3 py-1.5 rounded-xl ${
                  currentPath === l.to
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300 hover:text-[#1a2f5e] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions: Theme Toggle + Login Button */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-300 hover:text-[#1a2f5e] dark:hover:text-white hover:scale-105 active:scale-95"
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              <span
                className="inline-flex"
                style={{
                  transform: darkMode ? 'rotate(0deg)' : 'rotate(-30deg)',
                  transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </span>
            </button>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[#1a2f5e] dark:bg-[#3b6ff5] hover:bg-[#0f1f42] dark:hover:bg-[#2e5de0] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Lock size={14} /> Entrar no Sistema
            </Link>
          </div>

          {/* Mobile Actions and Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              className="text-gray-600 dark:text-gray-300 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 dark:border-slate-800 pt-4 space-y-2">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm font-semibold p-2.5 rounded-lg ${
                  currentPath === l.to
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-[#1a2f5e] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-[#1a2f5e] dark:bg-[#3b6ff5] text-white text-sm font-bold w-full py-3 rounded-xl hover:bg-[#0f1f42] dark:hover:bg-[#2e5de0] transition-colors"
              >
                <Lock size={14} /> Entrar no Sistema
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar;
