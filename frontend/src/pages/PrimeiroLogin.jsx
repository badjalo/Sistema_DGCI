import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const PrimeiroLogin = () => {
  const { user, markPasswordChanged } = useAuth();
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const requisitos = [
    { label: 'Mínimo 8 caracteres', ok: form.new_password.length >= 8 },
    { label: 'Pelo menos uma letra maiúscula', ok: /[A-Z]/.test(form.new_password) },
    { label: 'Pelo menos um número', ok: /[0-9]/.test(form.new_password) },
    { label: 'As senhas coincidem', ok: form.new_password.length > 0 && form.new_password === form.confirm_password },
  ];
  const allOk = requisitos.every(r => r.ok);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allOk) {
      return toast.error('Por favor, verifique os requisitos da nova senha.');
    }

    setLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });

      if (res.data.success) {
        toast.success('Senha alterada com sucesso! Bem-vindo ao sistema.');
        markPasswordChanged();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao alterar a senha. Verifique a senha atual.');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}
    >
      {/* Background decorative circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)' }}
              >
                <AlertTriangle size={28} className="text-yellow-400" />
              </div>
            </div>

            {logo && (
              <img src={logo} alt="SF-DGCI" className="w-12 h-12 object-contain mx-auto mb-3 opacity-80" />
            )}

            <h1 className="text-2xl font-bold text-white mb-2">Primeiro Acesso</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Olá, <strong className="text-white">{user?.nome}</strong>! Por segurança, deves alterar a tua senha padrão antes de continuar.
            </p>
          </div>

          {/* Info Box */}
          <div
            className="rounded-xl p-3 mb-6 flex items-start gap-3"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
          >
            <ShieldCheck size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-yellow-400">Senha padrão do sistema</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                A senha temporária é: <code className="text-yellow-300 font-mono">sf-dgci123*#</code>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Senha Atual */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Senha Atual (Padrão)
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="sf-dgci123*#"
                  value={form.current_password}
                  onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-white outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => toggle('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-white"
                >
                  {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.new_password}
                  onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-white outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => toggle('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-white"
                >
                  {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  value={form.confirm_password}
                  onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-white outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => toggle('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-white"
                >
                  {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Requisitos */}
            {form.new_password.length > 0 && (
              <div className="space-y-1.5 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs font-semibold text-white mb-2">Requisitos da senha:</p>
                {requisitos.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2
                      size={13}
                      className={req.ok ? 'text-green-400' : 'text-slate-500'}
                    />
                    <span className={req.ok ? 'text-green-400' : 'text-slate-400'}>{req.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !allOk}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2"
              style={{
                background: allOk
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : 'rgba(255,255,255,0.1)',
                color: allOk ? '#fff' : 'rgba(255,255,255,0.3)',
                cursor: allOk ? 'pointer' : 'not-allowed',
                boxShadow: allOk ? '0 8px 24px rgba(59,130,246,0.4)' : 'none',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A processar...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <KeyRound size={16} />
                  Alterar Senha e Entrar
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
          SF-DGCI © {new Date().getFullYear()} — Sistema de Gestão Sindical
        </p>
      </div>
    </div>
  );
};

export default PrimeiroLogin;
