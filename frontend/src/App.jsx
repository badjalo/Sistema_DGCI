import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MembrosList from './pages/Membros/MembrosList';
import MembroForm from './pages/Membros/MembroForm';
import MembroEditar from './pages/Membros/MembroEditar';
import MembroDetalhe from './pages/Membros/MembroDetalhe';
import Quotas from './pages/Quotas';
import Financeiro from './pages/Financeiro';
import Documentos from './pages/Documentos';
import Comunicados from './pages/Comunicados';
import Relatorios from './pages/Relatorios';
import Departamentos from './pages/Departamentos';
import Configuracoes from './pages/Configuracoes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff' } }} />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="membros" element={<MembrosList />} />
            <Route path="membros/novo" element={<MembroForm />} />
            <Route path="membros/:id" element={<MembroDetalhe />} />
            <Route path="membros/:id/editar" element={<MembroEditar />} />

            <Route path="quotas" element={<Quotas />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="comunicados" element={<Comunicados />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="departamentos" element={<Departamentos />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
