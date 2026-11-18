import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Spinner from './Spinner';
import Navbar from './Navbar';
import ScrollToTop from './ScrollToTop';
import ServerWakeBanner from './ServerWakeBanner';
import VerifyEmailBanner from './VerifyEmailNotice';

// Estructura común de la parte pública: barra arriba, contenido y pie
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <VerifyEmailBanner />
      <ServerWakeBanner />
      <main className="flex-1">
        {/* Mientras se descarga el código de la página, un spinner */}
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="border-t border-white/5 py-8 text-center text-sm text-zinc-500">
        <p>Butaca · Proyecto del Módulo Full-Stack JS</p>
        <p className="mt-1">Datos de películas proporcionados por TMDB</p>
      </footer>
    </div>
  );
}
