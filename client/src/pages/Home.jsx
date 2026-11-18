import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { getList } from '../services/movies';
import MovieRow from '../components/MovieRow';
import TrendingHero from '../components/TrendingHero';
import Ratatus from '../components/Ratatus';
import CollectionCard from '../components/CollectionCard';
import { getPublicCollections } from '../services/admin';
import ErrorMessage from '../components/ErrorMessage';

export default function Home() {
  const trending = useFetch(() => getList('trending'));
  const nowPlaying = useFetch(() => getList('now_playing'));
  const upcoming = useFetch(() => getList('upcoming'));
  const topRated = useFetch(() => getList('top_rated'));
  const featured = useFetch(() => getPublicCollections({ featured: 1 }));

  // Si la API de películas falla (TMDB caído o mal configurado), lo decimos en vez de dejar esqueletos eternos
  const moviesDown = trending.error && nowPlaying.error;

  return (
    <>
      {moviesDown && (
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <ErrorMessage message={`${trending.error}. Inténtalo de nuevo en unos minutos.`} />
        </div>
      )}

      {/* ---------- Escaparate: tendencias de la semana ---------- */}
      {!trending.error && <TrendingHero movies={trending.data?.results.filter((m) => m.backdrop)} loading={trending.loading} />}

      {/* ---------- Banda de Ratatús ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-butaca-700/30 via-telon to-telon p-5 text-center sm:flex-row sm:text-left">
          <div className="w-20 shrink-0"><Ratatus /></div>
          <div className="flex-1">
            <h2 className="font-display text-3xl leading-none tracking-wide">¿Qué vemos esta noche?</h2>
            <p className="mt-1 text-zinc-400">
              Dile a Ratatús cómo te sientes, con quién estás y cuánto tiempo tienes. Te elige la película perfecta
              para que dejéis de discutir y empecéis a disfrutar.
            </p>
          </div>
          <Link to="/sommelier" className="btn-primary shrink-0 px-6 py-3">🐀 Pregúntale a Ratatús</Link>
        </div>
      </section>

      {/* ---------- Colecciones destacadas (contenido del Back-Office) ---------- */}
      {featured.data?.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6" aria-label="Colecciones destacadas">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-3xl tracking-wide">Colecciones de Butaca</h2>
            <Link to="/colecciones" className="text-sm font-medium text-butaca-500 hover:underline">Ver todas</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data.slice(0, 3).map((c) => <CollectionCard key={c._id} collection={c} />)}
          </div>
        </section>
      )}

      {/* ---------- Filas de películas ---------- */}
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
