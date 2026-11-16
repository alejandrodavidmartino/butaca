import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Portada provisional: en el paso de TMDB añadiremos estrenos y populares
export default function Home() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-butaca-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-4xl px-4 py-28 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-butaca-500">Se apagan las luces</p>
        <h1 className="mt-4 font-display text-6xl leading-none tracking-wide sm:text-8xl">
          ¿Qué vemos esta noche?
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Dinos cómo te sientes, con quién estás y cuánto tiempo tienes.
          Nuestra IA elige la película perfecta para que dejéis de discutir y empecéis a disfrutar.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/peliculas" className="btn-primary px-6 py-3 text-base">Explorar películas</Link>
          {!user && <Link to="/registro" className="btn-ghost px-6 py-3 text-base">Crear cuenta gratis</Link>}
        </div>
      </div>
    </section>
  );
}
