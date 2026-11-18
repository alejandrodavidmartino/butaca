import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import { useAuth } from './context/AuthContext';

// Cada página se descarga solo cuando se visita (code splitting).
// La portada va incluida desde el principio porque es lo primero que se ve.
const Movies = lazy(() => import('./pages/Movies'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const MyGroups = lazy(() => import('./pages/MyGroups'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const JoinGroup = lazy(() => import('./pages/JoinGroup'));
const Sommelier = lazy(() => import('./pages/Sommelier'));
const MyWatched = lazy(() => import('./pages/MyWatched'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const Person = lazy(() => import('./pages/Person'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./admin/AdminUsers'));
const AdminCollections = lazy(() => import('./admin/AdminCollections'));
const CollectionEditor = lazy(() => import('./admin/CollectionEditor'));
const AdminTaxonomy = lazy(() => import('./admin/AdminTaxonomy'));
const AdminModeration = lazy(() => import('./admin/AdminModeration'));
const Collections = lazy(() => import('./pages/Collections'));
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/peliculas" element={<Movies />} />
        <Route path="/pelicula/:id" element={<MovieDetail />} />
        <Route path="/persona/:id" element={<Person />} />
        <Route path="/colecciones" element={<Collections />} />
        <Route path="/colecciones/:slug" element={<CollectionDetail />} />
        <Route path="/verificar" element={<VerifyEmail />} />
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
