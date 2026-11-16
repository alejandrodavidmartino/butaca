import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Movies from './pages/Movies';
import Login from './pages/Login';
import Register from './pages/Register';
import MyButaca from './pages/MyButaca';
import NotFound from './pages/NotFound';
import AdminDashboard from './admin/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/peliculas" element={<Movies />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        {/* Solo usuarios registrados */}
        <Route element={<ProtectedRoute />}>
          <Route path="/mi-butaca" element={<MyButaca />} />
        </Route>

        {/* Solo administradores */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
