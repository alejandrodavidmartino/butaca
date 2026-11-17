import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { getMovie } from '../services/movies';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import MovieRow from '../components/MovieRow';
import Rating from '../components/Rating';
import AddToGroup from '../components/AddToGroup';
import WatchedButton from '../components/WatchedButton';
import { useAuth } from '../context/AuthContext';

// Pasa minutos a "2 h 2 min"
const formatRuntime = (min) => (min ? `${Math.floor(min / 60)} h ${min % 60} min` : null);

export default function MovieDetail() {
  const { id } = useParams();
  const { data: movie, loading, error } = useFetch(() => getMovie(id), [id]);
  const [showTrailer, setShowTrailer] = useState(false);
  const { user } = useAuth();

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  const facts = [movie.year, formatRuntime(movie.runtime), movie.certification && `+${movie.certification}`].filter(Boolean);

  return (
    <article>
      {/* ---------- Cabecera con imagen de fondo ---------- */}
      <header className="relative isolate overflow-hidden">
        {movie.backdrop && (
          <img src={movie.backdrop} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-sala via-sala/80 to-sala/40" />

        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 md:flex-row md:py-20">
          <div className="mx-auto w-56 shrink-0 md:mx-0 md:w-72">
            {movie.poster ? (
              <img src={movie.poster} alt={`Cartel de ${movie.title}`} className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10" />
            ) : (
              <div className="grid aspect-[2/3] place-items-center rounded-2xl bg-telon text-zinc-500">Sin cartel</div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="font-display text-5xl leading-none tracking-wide sm:text-7xl">{movie.title}</h1>
            {movie.originalTitle !== movie.title && (
              <p className="mt-1 text-zinc-400">Título original: {movie.originalTitle}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-300">
              <Rating value={movie.rating} className="text-base" />
              {movie.voteCount > 0 && <span className="text-zinc-500">({movie.voteCount.toLocaleString('es-ES')} votos)</span>}
              {facts.map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <Link
                  key={g.id}
                  to={`/peliculas?genre=${g.id}`}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300 hover:border-butaca-500 hover:text-white"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            {movie.tagline && <p className="mt-6 text-lg italic text-zinc-400">“{movie.tagline}”</p>}
            <p className="mt-4 max-w-3xl leading-relaxed text-zinc-200">
              {movie.overview || 'Todavía no hay sinopsis en español para esta película.'}
            </p>

            {movie.directors.length > 0 && (
              <p className="mt-4 text-sm text-zinc-400">
                Dirección: <span className="text-zinc-200">{movie.directors.join(', ')}</span>
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {movie.trailerKey && (
                <button onClick={() => setShowTrailer(true)} className="btn-primary px-5 py-3">
                  ▶ Ver tráiler
                </button>
              )}
              {user && <WatchedButton movie={movie} />}
              {user ? (
                <AddToGroup tmdbId={movie.id} />
              ) : (
                <Link to="/login" state={{ from: `/pelicula/${movie.id}` }} className="btn-ghost px-5 py-3">
                  Inicia sesión para añadirla a un grupo
                </Link>
              )}
            </div>

            <WatchProviders watch={movie.watch} />
          </div>
        </div>
      </header>

      {/* ---------- Reparto ---------- */}
      {movie.cast.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <h2 className="font-display text-3xl tracking-wide">Reparto principal</h2>
          <ul className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {movie.cast.map((c) => (
              <li key={c.id} className="w-28 shrink-0 text-center">
                {c.photo ? (
                  <img src={c.photo} alt={c.name} loading="lazy" className="mx-auto h-28 w-28 rounded-full object-cover" />
                ) : (
                  <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-telon text-2xl">🎭</div>
                )}
                <p className="mt-2 text-sm font-medium leading-tight">{c.name}</p>
                <p className="text-xs text-zinc-500">{c.character}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {movie.similar.length > 0 && <MovieRow title="Si te gusta, prueba con…" movies={movie.similar} />}

      {/* ---------- Ventana del tráiler ---------- */}
      {showTrailer && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4"
          onClick={() => setShowTrailer(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Tráiler de ${movie.title}`}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTrailer(false)} className="mb-2 ml-auto block text-sm text-zinc-300 hover:text-white">
              Cerrar ✕
            </button>
            <div className="aspect-video overflow-hidden rounded-xl">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1`}
                title={`Tráiler de ${movie.title}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

// Plataformas donde ver la película en España (datos de JustWatch vía TMDB)
function WatchProviders({ watch }) {
  const groups = [
    ['Incluida en', watch.flatrate],
    ['Alquiler', watch.rent],
    ['Compra', watch.buy],
  ].filter(([, list]) => list.length > 0);

  if (groups.length === 0) {
    return <p className="mt-8 text-sm text-zinc-500">No está disponible en plataformas de streaming en España.</p>;
  }

  return (
    <div className="mt-8 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Dónde verla en España</h2>
      {groups.map(([label, list]) => (
        <div key={label} className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-sm text-zinc-400">{label}</span>
          {list.map((p) => (
            <img key={p.id} src={p.logo} alt={p.name} title={p.name} className="h-9 w-9 rounded-lg" />
          ))}
        </div>
      ))}
      <p className="text-xs text-zinc-500">Datos de disponibilidad: JustWatch</p>
    </div>
  );
}
