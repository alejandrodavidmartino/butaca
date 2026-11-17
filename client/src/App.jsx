import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Movies from './pages/Movies';
import Login from './pages/Login';
import Register from './pages/Register';
import MyGroups from './pages/MyGroups';
import GroupDetail from './pages/GroupDetail';
import JoinGroup from './pages/JoinGroup';
import Sommelier from './pages/Sommelier';
import MyWatched from './pages/MyWatched';
import MovieDetail from './pages/MovieDetail';
import NotFound from './pages/NotFound';
import AdminDashboard from './admin/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/peliculas" element={<Movies />} />
        <Route path="/pelicula/:id" element={<MovieDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        {/* Solo usuarios registrados */}
        <Route element={<ProtectedRoute />}>
          <Route path="/grupos" element={<MyGroups />} />
          <Route path="/grupos/:id" element={<GroupDetail />} />
          <Route path="/unirse/:code" element={<JoinGroup />} />
          <Route path="/sommelier" element={<Sommelier />} />
          <Route path="/mis-vistas" element={<MyWatched />} />
          <Route path="/mi-butaca" element={<Navigate to="/grupos" replace />} />
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
