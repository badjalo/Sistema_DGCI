import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';

// Pages — Públicas
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Noticias from './pages/Noticias';
import DocumentosPublicos from './pages/DocumentosPublicos';
import Sindicato from './pages/Sindicato';
import Contacto from './pages/Contacto';
import EsqueciSenha from './pages/EsqueciSenha';


// Pages — Protegidas
import Dashboard from './pages/Dashboard';
import MembrosList from './pages/Membros/MembrosList';
import MembroForm from './pages/Membros/MembroForm';
import MembroEditar from './pages/Membros/MembroEditar';
import MembroDetalhe from './pages/Membros/MembroDetalhe';
import MembroCartao from './pages/Membros/MembroCartao';
import Quotas from './pages/Quotas';
import Financeiro from './pages/Financeiro';
import Documentos from './pages/Documentos';
import Comunicados from './pages/Comunicados';
import Relatorios from './pages/Relatorios';
import Departamentos from './pages/Departamentos';
import SindicatoAdmin from './pages/SindicatoAdmin';
import Mensagens from './pages/Mensagens';
import Auditoria from './pages/Auditoria';
import Configuracoes from './pages/Configuracoes';
import Utilizadores from './pages/Utilizadores';
import Perfil from './pages/Perfil';
import Transparencia from './pages/Transparencia';
import Votacoes from './pages/Votacoes';

function App() {
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--surface)',
              color: 'var(--text-1)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow-lg)',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '0.75rem 1rem',
              maxWidth: '380px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
              style: { borderLeft: '4px solid #10b981' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              style: { borderLeft: '4px solid #ef4444' },
            },
          }}
        />
        <Routes>
          {/* ── Rotas Públicas ─────────────────────────────────────────────── */}
          <Route path="/"                    element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/sindicato"           element={<Sindicato />} />
          <Route path="/noticias"            element={<Noticias />} />
          <Route path="/documentos-publicos" element={<DocumentosPublicos />} />
          <Route path="/contacto"            element={<Contacto />} />
          <Route path="/esqueci-senha"        element={<EsqueciSenha />} />

          <Route path="/login"               element={<Login />} />

          {/* ── Rotas Protegidas ───────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"              element={<Dashboard />} />

              <Route path="/membros"                element={<MembrosList />} />
              <Route path="/membros/novo"           element={<MembroForm />} />
              <Route path="/membros/:id"            element={<MembroDetalhe />} />
              <Route path="/membros/:id/editar"     element={<MembroEditar />} />
              <Route path="/membros/:id/cartao"     element={<MembroCartao />} />

              <Route path="/quotas"                 element={<Quotas />} />
              <Route path="/financeiro"             element={<Financeiro />} />
              <Route path="/documentos"             element={<Documentos />} />
              <Route path="/comunicados"            element={<Comunicados />} />
              <Route path="/relatorios"             element={<Relatorios />} />
              <Route path="/departamentos"          element={<Departamentos />} />
              <Route path="/sindicato-admin"        element={<SindicatoAdmin />} />
              <Route path="/mensagens"              element={<Mensagens />} />
              <Route path="/auditoria"              element={<Auditoria />} />
              <Route path="/configuracoes"          element={<Configuracoes />} />
              <Route path="/utilizadores"           element={<Utilizadores />} />
              <Route path="/perfil"                 element={<Perfil />} />
              <Route path="/transparencia"          element={<Transparencia />} />
              <Route path="/votacoes"               element={<Votacoes />} />
            </Route>
          </Route>

          {/* ── Fallback ───────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
