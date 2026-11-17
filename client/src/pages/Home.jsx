import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { getList } from '../services/movies';
import MovieRow from '../components/MovieRow';
import Rating from '../components/Rating';

export default function Home() {
  const { user } = useAuth();
  const trending = useFetch(() => getList('trending'));
  const nowPlaying = useFetch(() => getList('now_playing'));
  const upcoming = useFetch(() => getList('upcoming'));
  const topRated = useFetch(() => getList('top_rated'));

  // La película destacada de la portada: la primera en tendencias con imagen de fondo
  const featured = trending.data?.results.find((m) => m.backdrop);

  return (
    <>
      {/* ---------- Cabecera con película destacada ---------- */}
      <section className="relative isolate overflow-hidden">
        {featured && (
          <img
            src={featured.backdrop}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-sala via-sala/70 to-sala/30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-sala via-sala/40 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:pt-32">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-butaca-500">Se apagan las luces</p>
          <h1 className="mt-3 max-w-3xl font-display text-6xl leading-none tracking-wide sm:text-8xl">
            ¿Qué vemos esta noche?
          </h1>
          <p className="mt-5 max-w-xl text-lg text-zinc-300">
            Dinos cómo te sientes, con quién estás y cuánto tiempo tienes. Nuestra IA elige la película
            perfecta para que dejéis de discutir y empecéis a disfrutar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/sommelier" className="btn-primary px-6 py-3 text-base">🍷 Pregunta al Sommelier IA</Link>
            <Link to="/peliculas" className="btn-ghost px-6 py-3 text-base">Explorar películas</Link>
            {!user && <Link to="/registro" className="btn-ghost px-6 py-3 text-base">Crear cuenta gratis</Link>}
          </div>

          {featured && (
            <Link
              to={`/pelicula/${featured.id}`}
              className="mt-14 inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/40 py-1.5 pl-1.5 pr-4 text-sm backdrop-blur transition hover:border-butaca-500/60"
            >
              <span className="rounded-full bg-butaca-500 px-2.5 py-1 text-xs font-semibold">Tendencia nº 1</span>
              <span className="font-medium">{featured.title}</span>
              <Rating value={featured.rating} />
            </Link>
          )}
        </div>
      </section>

      {/* ---------- Filas de películas ---------- */}
      <MovieRow title="Tendencias de la semana" movies={trending.data?.results} loading={trending.loading} />
      <MovieRow title="Ahora en cines" movies={nowPlaying.data?.results} loading={nowPlaying.loading} />
      <MovieRow title="Próximos estrenos" movies={upcoming.data?.results} loading={upcoming.loading} />
      <MovieRow
        title="Las mejor valoradas"
        movies={topRated.data?.results}
        loading={topRated.loading}
        link="/peliculas?sort=vote_average.desc"
      />
    </>
  );
}
