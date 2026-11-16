import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// Estructura común de la parte pública: barra arriba, contenido y pie
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-8 text-center text-sm text-zinc-500">
        <p>Butaca · Proyecto final Full-Stack JS</p>
        <p className="mt-1">Datos de películas proporcionados por TMDB</p>
      </footer>
    </div>
  );
}
