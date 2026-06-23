import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft,
  KeyRound, Eye, EyeOff, CheckCircle2, RefreshCw
} from 'lucide-react';
import api from '../services/api';

// ─── Step 1: Pedir Código ──────────────────────────────────────────────────
const StepPedirCodigo = ({ onNext }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Insira o seu email institucional.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/recuperar-senha', { email });
      toast.success('Pedido enviado! O administrador receberá uma notificação com o código.');
      onNext(email);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4"
          style={{
            background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
            boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
          }}
        >
          <Mail size={26} className="text-white" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
          Recuperar Senha
        </h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-3)' }}>
          Insira o seu email para solicitar um código ao administrador
        </p>
      </div>

      {/* Email */}
      <div className="form-group mb-0">
        <label className="form-label">Email Institucional</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@sf-dgci.gw"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            disabled={loading}
          />
        </div>
      </div>

      {/* Info */}
      <div
        className="flex items-start gap-2.5 p-3 rounded-xl text-sm"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <ShieldCheck size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
        <p style={{ color: 'var(--text-2)' }}>
          O administrador receberá uma notificação com um <strong>código de 6 dígitos</strong> válido por 2 horas.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
        style={{ padding: '0.75rem 1.25rem' }}
      >
        {loading ? (
          <><RefreshCw size={16} className="animate-spin" /> A enviar…</>
        ) : (
          <>Solicitar Código <ArrowRight size={16} /></>
        )}
      </button>
    </form>
  );
};

// ─── Step 2: Inserir Código + Nova Senha ───────────────────────────────────
const StepRedefinir = ({ email, onSuccess }) => {
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !novaSenha || !confirmar) { toast.error('Preencha todos os campos.'); return; }
    if (novaSenha.length < 8) { toast.error('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (novaSenha !== confirmar) { toast.error('As senhas não coincidem.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/redefinir-senha', { email, token, nova_senha: novaSenha });
      toast.success('Senha redefinida com sucesso!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4"
          style={{
            background: 'linear-gradient(135deg,#6366f1,#3b6ff5)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}
        >
          <KeyRound size={26} className="text-white" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
          Inserir Código
        </h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-3)' }}>
          O código foi enviado ao administrador para <strong style={{ color: 'var(--primary)' }}>{email}</strong>
        </p>
      </div>

      {/* Código */}
      <div className="form-group mb-0">
        <label className="form-label">Código de Recuperação (6 dígitos)</label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="form-control text-center font-mono text-xl tracking-[0.5em]"
          maxLength={6}
          disabled={loading}
        />
      </div>

      {/* Nova senha */}
      <div className="form-group mb-0">
        <label className="form-label">Nova Senha</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
          <input
            type={showPass ? 'text' : 'password'}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="form-control"
            style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Confirmar */}
      <div className="form-group mb-0">
        <label className="form-label">Confirmar Senha</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
          <input
            type={showPass ? 'text' : 'password'}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Repita a nova senha"
            className="form-control"
            style={{
              paddingLeft: '2.5rem',
              borderColor: confirmar && novaSenha && confirmar !== novaSenha ? '#ef4444' : undefined,
            }}
            disabled={loading}
          />
        </div>
        {confirmar && novaSenha && confirmar !== novaSenha && (
          <p className="text-xs mt-1" style={{ color: '#ef4444' }}>As senhas não coincidem</p>
        )}
      </div>

      {/* Força da senha */}
      {novaSenha && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1,2,3,4].map((level) => {
              const strength = novaSenha.length >= 12 ? 4 : novaSenha.length >= 10 ? 3 : novaSenha.length >= 8 ? 2 : 1;
              return (
                <div
                  key={level}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{
                    background: level <= strength
                      ? strength >= 4 ? '#10b981' : strength >= 3 ? '#3b82f6' : strength >= 2 ? '#f59e0b' : '#ef4444'
                      : 'var(--border)',
                  }}
                />
              );
            })}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            {novaSenha.length >= 12 ? '✓ Senha forte' : novaSenha.length >= 10 ? '✓ Senha boa' : novaSenha.length >= 8 ? '⚠ Senha fraca' : '✗ Muito curta'}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !token || !novaSenha || !confirmar}
        className="btn btn-primary w-full"
        style={{ padding: '0.75rem 1.25rem' }}
      >
        {loading ? (
          <><RefreshCw size={16} className="animate-spin" /> A redefinir…</>
        ) : (
          <>Redefinir Senha <ArrowRight size={16} /></>
        )}
      </button>
    </form>
  );
};

// ─── Step 3: Sucesso ────────────────────────────────────────────────────────
const StepSucesso = () => (
  <div className="text-center py-4">
    <div
      className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-5"
      style={{ background: 'rgba(16,185,129,0.12)', animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      <CheckCircle2 size={36} style={{ color: '#10b981' }} />
    </div>
    <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>
      Senha Redefinida!
    </h2>
    <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
      A sua senha foi atualizada com sucesso. Pode entrar agora com as novas credenciais.
    </p>
    <Link
      to="/login"
      className="btn btn-primary w-full"
      style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'center' }}
    >
      Ir para o Login <ArrowRight size={16} />
    </Link>
  </div>
);

// ─── Main Export ───────────────────────────────────────────────────────────
const EsqueciSenha = () => {
  const [step, setStep] = useState(1); // 1 = pedir, 2 = redefinir, 3 = sucesso
  const [email, setEmail] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden gradient-animated">
      {/* Blobs decorativos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-float absolute" style={{
          top: '10%', right: '15%', width: '360px', height: '360px',
          background: 'radial-gradient(circle,rgba(245,158,11,0.15) 0%,transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)',
        }} />
        <div className="animate-float-delay absolute" style={{
          bottom: '15%', left: '10%', width: '300px', height: '300px',
          background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)',
        }} />
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />
      </div>

      <div
        className="w-full max-w-md z-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.5s ease,transform 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6" style={{ animation: 'fadeUp 0.4s ease-out 0.1s both' }}>
          <h1 className="text-3xl font-bold text-white tracking-tight">SF-DGCI</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(148,163,184,0.8)' }}>
            Sistema de Gestão Sindical
          </p>
        </div>

        {/* Card */}
        <div className="glass-surface rounded-2xl p-8" style={{ animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both' }}>

          {/* Progresso */}
          {step < 3 && (
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                    style={{
                      background: s <= step ? 'var(--primary)' : 'var(--surface-2)',
                      color: s <= step ? '#fff' : 'var(--text-3)',
                    }}
                  >
                    {s}
                  </div>
                  {s < 2 && (
                    <div
                      className="flex-1 h-0.5 rounded-full transition-all"
                      style={{ background: step >= 2 ? 'var(--primary)' : 'var(--border)' }}
                    />
                  )}
                </React.Fragment>
              ))}
              <span className="text-xs ml-2" style={{ color: 'var(--text-3)' }}>
                {step === 1 ? 'Identificação' : 'Nova senha'}
              </span>
            </div>
          )}

          {/* Conteúdo por step */}
          {step === 1 && (
            <StepPedirCodigo onNext={(e) => { setEmail(e); setStep(2); }} />
          )}
          {step === 2 && (
            <StepRedefinir email={email} onSuccess={() => setStep(3)} />
          )}
          {step === 3 && <StepSucesso />}
        </div>

        {/* Link voltar ao login */}
        {step < 3 && (
          <div className="text-center mt-5" style={{ animation: 'fadeUp 0.4s ease-out 0.4s both' }}>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-75"
              style={{ color: 'rgba(148,163,184,0.8)' }}
            >
              <ArrowLeft size={14} />
              Voltar ao Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EsqueciSenha;
