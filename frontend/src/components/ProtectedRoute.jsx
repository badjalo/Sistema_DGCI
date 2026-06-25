import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrimeiroLogin from '../pages/PrimeiroLogin';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ background: 'var(--bg)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o utilizador tem que mudar a senha (primeiro login), mostrar a tela de mudança
  if (user.deve_mudar_senha) {
    return <PrimeiroLogin />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
