import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { getGenres } from '../services/movies';
import FocusCarousel from './FocusCarousel';
import AddToGroup from './AddToGroup';
import Rating from './Rating';

// Escaparate de la portada: el fondo y la información cambian según la película
// que esté en el centro del carrusel pequeño (fundido cruzado suave).
export default function TrendingHero({ movies = [], loading }) {
  const { user } = useAuth();
  const { data: genres } = useFetch(getGenres);
  const [active, setActive] = useState(null);
  const [index, setIndex] = useState(0);
  // Guardamos las últimas imágenes de fondo para hacer el fundido entre ellas
  const [layers, setLayers] = useState([]);

  const handleActive = (movie, i) => {
    setActive(movie);
    setIndex(i);
    if (movie.backdrop) {
      setLayers((prev) => [...prev.filter((l) => l.id !== movie.id), { id: movie.id, src: movie.backdrop }].slice(-2));
    }
  };

  const genreNames = active?.genreIds
    ?.map((id) => genres?.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <section className="relative isolate overflow-hidden" aria-label="Tendencias de la semana">
      {/* ---------- Fondo con fundido cruzado ---------- */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {layers.map((l, i) => (
          <img
            key={l.id}
            src={l.src}
            alt=""
            // La nueva entra con un fundido y la anterior se desvanece: fundido cruzado sin "doble exposición"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-safe:animate-[fade-in_500ms_ease-out]"
            style={{ opacity: i === layers.length - 1 ? 0.45 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-sala via-sala/60 to-sala/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-sala via-sala/50 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-14 sm:pt-20">
        {/* ---------- Información de la película central ---------- */}
        <div className="min-h-[300px] max-w-2xl sm:min-h-[320px]">
          {loading || !active ? (
            <div className="space-y-4 pt-6">
              <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-16 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            </div>
          ) : (
            <div key={active.id} className="motion-safe:animate-[fade-up_300ms_ease-out]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-butaca-500">
                Tendencia nº {index + 1} esta semana
              </p>
              <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-wide sm:text-7xl">{active.title}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-300">
                <Rating value={active.rating} className="text-base" />
                {active.year && <span>{active.year}</span>}
                {genreNames?.map((g) => (
                  <span key={g} className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs">{g}</span>
                ))}
              </p>
              <p className="mt-4 line-clamp-3 max-w-xl text-zinc-300">
                {active.overview || 'Todavía no hay sinopsis en español para esta película.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/pelicula/${active.id}`} className="btn-primary px-6 py-3 text-base">Ver ficha y tráiler</Link>
                {user ? (
                  <AddToGroup tmdbId={active.id} />
                ) : (
                  <Link to="/registro" className="btn-ghost px-5 py-3">Crea tu cuenta y añádela a un grupo</Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---------- Carrusel pequeño para elegir ---------- */}
        <div className="-mx-4 mt-2 pb-6">
          {!loading && <FocusCarousel movies={movies} size="sm" align="start" showInfo={false} initialIndex={0} onActiveChange={handleActive} label="Tendencias de la semana" />}
        </div>
      </div>
    </section>
  );
}
