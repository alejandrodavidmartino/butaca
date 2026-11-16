import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

// Envuelve rutas que requieren sesión. Con adminOnly, además exige rol admin.
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  // Sin sesión: al login, recordando a dónde quería ir
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
