import React, { useState, useEffect } from 'react';
import {
  User, KeyRound, Mail, Camera, Shield, Check, AlertCircle, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
];

const Perfil = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('geral'); // geral | seguranca

  // Geral states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingGeral, setSavingGeral] = useState(false);

  // Segurança states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingSeguranca, setSavingSeguranca] = useState(false);

  // Mostrar passwords
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Carregar dados iniciais do utilizador
  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      toast.error('Nome e Email são obrigatórios.');
      return;
    }

    setSavingGeral(true);
    try {
      const res = await api.put('/auth/profile', {
        nome,
        email,
        avatar_url: avatarUrl
      });
      if (res.data.success) {
        setUser({ ...user, ...res.data.data });
        toast.success('Perfil atualizado com sucesso.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar perfil.');
    } finally {
      setSavingGeral(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação da nova password não coincide.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('A nova password deve ter pelo menos 8 caracteres.');
      return;
    }

    setSavingSeguranca(true);
    try {
      const res = await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      if (res.data.success) {
        toast.success('Password alterada com sucesso.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao alterar password.');
    } finally {
      setSavingSeguranca(false);
    }
  };

  // Calcular força da password
  const getPasswordStrength = () => {
    if (!newPassword) return null;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 1) return { text: 'Fraca', color: '#ef4444' };
    if (score === 2) return { text: 'Média', color: '#f59e0b' };
    return { text: 'Forte', color: '#10b981' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            <User size={20} />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-1)' }}>
            O Meu Perfil
          </h1>
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', paddingLeft: '52px' }}>
          Gerir dados de conta e definições de segurança pessoais
        </p>
        <div className="page-header-accent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Lado Esquerdo: Info Resumida e Navegação */}
        <div className="md:col-span-1 space-y-4">
          <div className="card text-center p-5 flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/30 flex items-center justify-center" style={{ background: 'var(--border)' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold text-white">{nome.charAt(0)}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={18} className="text-white" />
              </div>
            </div>

            <h3 className="font-extrabold text-sm mt-3 truncate w-full" style={{ color: 'var(--text-1)' }}>
              {nome || 'Utilizador'}
            </h3>
            <p className="text-xs mt-0.5 truncate w-full" style={{ color: 'var(--text-3)' }}>
              {email}
            </p>
            <div className="mt-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block"
              style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
              {user?.perfil}
            </div>
          </div>

          <div className="card p-2 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('geral')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors text-left"
              style={{
                background: activeTab === 'geral' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'geral' ? 'var(--primary)' : 'var(--text-3)',
              }}
            >
              <User size={16} />
              Dados Gerais
            </button>
            <button
              onClick={() => setActiveTab('seguranca')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors text-left"
              style={{
                background: activeTab === 'seguranca' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'seguranca' ? 'var(--primary)' : 'var(--text-3)',
              }}
            >
              <KeyRound size={16} />
              Segurança
            </button>
          </div>
        </div>

        {/* Lado Direito: Formulários */}
        <div className="md:col-span-3">
          {activeTab === 'geral' ? (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-extrabold text-base" style={{ color: 'var(--text-1)' }}>Dados da Conta</h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Mantenha as suas informações pessoais atualizadas.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="form-control pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email de Acesso</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control pl-9"
                      required
                    />
                  </div>
                </div>

                {/* Selecionar Avatar */}
                <div className="space-y-2.5">
                  <label className="form-label">Escolher Foto de Perfil</label>
                  <div className="grid grid-cols-6 gap-3">
                    {AVATARS.map((av, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setAvatarUrl(av)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 relative transition-all hover:scale-105 ${avatarUrl === av ? 'border-indigo-500 scale-105' : 'border-transparent'}`}
                      >
                        <img src={av} alt="Avatar option" className="w-full h-full object-cover" />
                        {avatarUrl === av && (
                          <div className="absolute inset-0 bg-indigo-500/40 flex items-center justify-center">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="form-group pt-2">
                    <label className="form-label">Ou URL de Imagem Personalizada</label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="form-control text-xs"
                      placeholder="https://exemplo.com/sua-imagem.jpg"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={savingGeral}
                    className="btn btn-primary flex items-center gap-2 px-6"
                  >
                    {savingGeral ? <RefreshCw size={15} className="animate-spin" /> : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-extrabold text-base" style={{ color: 'var(--text-1)' }}>Alterar Palavra-passe</h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Aconselhamos a mudar a sua senha regularmente para sua proteção.</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Palavra-passe Atual</label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="form-control pl-9 pr-9"
                      placeholder="Introduza a sua senha atual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nova Palavra-passe</label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control pl-9 pr-9"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {strength && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>Força da palavra-passe:</span>
                      <span className="text-xs font-bold" style={{ color: strength.color }}>{strength.text}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar Nova Palavra-passe</label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-control pl-9 pr-9"
                      placeholder="Repita a nova senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={savingSeguranca}
                    className="btn btn-primary flex items-center gap-2 px-6"
                  >
                    {savingSeguranca ? <RefreshCw size={15} className="animate-spin" /> : 'Atualizar Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
