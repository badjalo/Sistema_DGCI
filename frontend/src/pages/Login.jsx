import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Lock, Mail, ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail) setEmail(savedEmail);
    if (savedRemember) setRememberMe(true);
    // Trigger mount animation
    const t = setTimeout(() => setMounted(true), 10);

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const moveX = (clientX - window.innerWidth / 2) * 0.05;
      const moveY = (clientY - window.innerHeight / 2) * 0.05;
      document.documentElement.style.setProperty('--mouse-x', `${moveX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${moveY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(t);
    };
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberMe');
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Login efetuado com sucesso!');
        // ProtectedRoute interceta e mostra PrimeiroLogin se deve_mudar_senha === true
        navigate('/dashboard');
      } else {
        toast.error('Credenciais inválidas. Verifique o email e a palavra-passe.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao tentar autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden gradient-animated"
    >
      {/* Parallax blobs — move subtly with mouse */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="animate-float absolute"
          style={{
            top: '8%',
            left: '10%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(59,111,245,0.22) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
            transform: 'translate(calc(var(--mouse-x, 0px) * 1.2), calc(var(--mouse-y, 0px) * 1.2))',
            transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
        <div
          className="animate-float-delay absolute"
          style={{
            top: '45%',
            right: '5%',
            width: '380px',
            height: '380px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(45px)',
            transform: 'translate(calc(var(--mouse-x, 0px) * -0.8), calc(var(--mouse-y, 0px) * -0.8))',
            transition: 'transform 1s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
        <div
          className="animate-float-delay2 absolute"
          style={{
            bottom: '8%',
            left: '28%',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(42px)',
            transform: 'translate(calc(var(--mouse-x, 0px) * 0.6), calc(var(--mouse-y, 0px) * 0.6))',
            transition: 'transform 1.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Main container */}
      <div
        className="w-full max-w-md z-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5"
            style={{
              background: 'linear-gradient(135deg, #3b6ff5 0%, #6366f1 100%)',
              boxShadow: '0 8px 32px rgba(59,111,245,0.45), 0 0 0 1px rgba(255,255,255,0.1)',
              animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
            }}
          >
            <ShieldCheck size={32} className="text-white" />
          </div>

          <h1
            className="text-4xl font-bold text-white tracking-tight mb-1"
            style={{ animation: 'fadeUp 0.4s ease-out 0.2s both' }}
          >
            SF-DGCI
          </h1>
          <p
            className="text-sm"
            style={{ color: 'rgba(148,163,184,0.9)', animation: 'fadeUp 0.4s ease-out 0.3s both' }}
          >
            Sistema de Gestão Sindical
          </p>
        </div>

        {/* Card — with animated gradient border glow */}
        <div
          style={{
            animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both',
            borderRadius: '18px',
            padding: '2px',
            background: 'linear-gradient(135deg, rgba(59,111,245,0.5) 0%, rgba(168,85,247,0.4) 50%, rgba(16,185,129,0.3) 100%)',
            boxShadow: '0 0 40px rgba(59,111,245,0.15), 0 24px 64px rgba(0,0,0,0.4)',
          }}
        >
        <div
          className="glass-surface rounded-2xl p-8"
          style={{ borderRadius: '16px' }}
        >
          {/* Card header accent */}
          <div
            className="flex items-center gap-3 mb-6"
          >
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: 'var(--text-1)' }}
              >
                Bem-vindo de volta
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
                Aceda à sua conta para continuar
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email Input */}
            <div className="form-group mb-0">
              <label className="form-label">Email Institucional</label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  size={16}
                  style={{ color: 'var(--text-3)', transition: 'color 0.15s' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="usuario@sf-dgci.gw"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  id="login-email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group mb-0">
              <label className="form-label">Palavra-passe</label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  size={16}
                  style={{ color: 'var(--text-3)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-all hover:scale-110 active:scale-90"
                  style={{ color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: 'var(--primary)' }}
                    id="login-remember"
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-2)' }}>Lembrar sessão</span>
              </label>
              <Link
                to="/esqueci-senha"
                className="text-sm font-medium transition-opacity hover:opacity-75"
                style={{ color: 'var(--primary)' }}
              >
                Esqueceu a password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full mt-2"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.9375rem' }}
              id="login-submit"
            >
              {isSubmitting ? (
                <>
                  <div
                    className="spinner"
                    style={{ width: '18px', height: '18px', borderLeftColor: 'white', borderWidth: '2px' }}
                  />
                  A autenticar…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={16} style={{ transition: 'transform 0.2s' }} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            className="mt-6 pt-5 text-center border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Acesso restrito a membros autorizados
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Auditado e protegido • SF-DGCI
            </p>
          </div>
        </div>

        {/* Trust Badge */}
        <div
          className="mt-5 text-center"
          style={{ animation: 'fadeUp 0.4s ease-out 0.4s both' }}
        >
          <p className="text-xs" style={{ color: 'rgba(148,163,184,0.6)' }}>
            Ministério das Finanças • República da Guiné-Bissau
          </p>
        </div>
        </div>{/* end gradient border wrapper */}
      </div>
    </div>
  );
};

export default Login;
