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
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { useAuth } from './context/AuthContext';
import MovieDetail from './pages/MovieDetail';
import NotFound from './pages/NotFound';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminCollections from './admin/AdminCollections';
import CollectionEditor from './admin/CollectionEditor';
import AdminTaxonomy from './admin/AdminTaxonomy';
import AdminModeration from './admin/AdminModeration';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/peliculas" element={<Movies />} />
        <Route path="/pelicula/:id" element={<MovieDetail />} />
        <Route path="/colecciones" element={<Collections />} />
        <Route path="/colecciones/:slug" element={<CollectionDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        {/* Solo usuarios registrados */}
        <Route element={<ProtectedRoute />}>
          <Route path="/grupos" element={<MyGroups />} />
          <Route path="/grupos/:id" element={<GroupDetail />} />
          <Route path="/unirse/:code" element={<JoinGroup />} />
          <Route path="/sommelier" element={<Sommelier />} />
          <Route path="/mis-vistas" element={<MyWatched />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/perfil" element={<MyProfileRedirect />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="/mi-butaca" element={<Navigate to="/grupos" replace />} />
        </Route>

        {/* Solo administradores */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="colecciones" element={<AdminCollections />} />
            <Route path="colecciones/:id" element={<CollectionEditor />} />
            <Route path="categorias" element={<AdminTaxonomy />} />
            <Route path="moderacion" element={<AdminModeration />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

// /perfil -> /u/mi-usuario
function MyProfileRedirect() {
  const { user } = useAuth();
  return <Navigate to={`/u/${user.username}`} replace />;
}
