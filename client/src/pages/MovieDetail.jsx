import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { getMovie } from '../services/movies';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import MovieRow from '../components/MovieRow';
import Rating from '../components/Rating';
import AddToGroup from '../components/AddToGroup';
import WatchedButton from '../components/WatchedButton';
import WatchedModal from '../components/WatchedModal';
import MovieReviews from '../components/MovieReviews';
import { getWatchedEntry } from '../services/watched';
import { useAuth } from '../context/AuthContext';

const VIDEO_TYPES = { Trailer: 'Tráiler', Teaser: 'Teaser', Clip: 'Escena', Featurette: 'Making of' };

// Pasa minutos a "2 h 2 min"
const formatRuntime = (min) => (min ? `${Math.floor(min / 60)} h ${min % 60} min` : null);

export default function MovieDetail() {
  const { id } = useParams();
  const { data: movie, loading, error } = useFetch(() => getMovie(id), [id]);
  const [video, setVideo] = useState(null); // vídeo abierto en la ventana (o null)
  const { user } = useAuth();
  // Mi entrada en «Mis vistas» (undefined = cargando, null = no la he visto).
  // La comparten el botón «La he visto» y la sección de reseñas.
  const [entry, setEntry] = useState(undefined);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEntry(user ? undefined : null);
    if (user) getWatchedEntry(id).then(setEntry).catch(() => setEntry(null));
  }, [id, user]);

  // La ventana del vídeo se cierra con Escape
  useEffect(() => {
    if (!video) return;
    const onKey = (e) => e.key === 'Escape' && setVideo(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [video]);

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

            <Crew crew={movie.crew} />

            <div className="mt-8 flex flex-wrap gap-3">
              {movie.trailerKey && (
                <button onClick={() => setVideo(movie.videos[0])} className="btn-primary px-5 py-3">
                  ▶ Ver tráiler
                </button>
              )}
              {user && <WatchedButton entry={entry} onOpen={() => setEditing(true)} />}
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
          <ul className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
            {movie.cast.map((c) => (
              <li key={c.id} className="w-28 shrink-0 snap-start text-center">
                <Link to={`/persona/${c.id}`} className="group block">
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} loading="lazy" className="mx-auto h-28 w-28 rounded-full object-cover ring-2 ring-transparent transition group-hover:ring-butaca-500" />
                  ) : (
                    <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-telon text-2xl ring-2 ring-transparent transition group-hover:ring-butaca-500">🎭</div>
                  )}
                  <p className="mt-2 text-sm font-medium leading-tight group-hover:text-butaca-500">{c.name}</p>
                </Link>
                <p className="text-xs text-zinc-500">{c.character}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Valoraciones y reseñas de los usuarios ---------- */}
      <MovieReviews tmdbId={movie.id} me={user} myEntry={entry} onWrite={() => setEditing(true)} />

      {/* ---------- Vídeos ---------- */}
      {movie.videos.length > 1 && (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <h2 className="font-display text-3xl tracking-wide">Tráileres y vídeos</h2>
          <ul className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
            {movie.videos.map((v) => (
              <li key={v.key} className="w-64 shrink-0 snap-start sm:w-72">
                <button onClick={() => setVideo(v)} className="group block w-full text-left">
                  <span className="relative block aspect-video overflow-hidden rounded-xl bg-telon ring-1 ring-white/10 group-hover:ring-butaca-500/60">
                    <img src={`https://i.ytimg.com/vi/${v.key}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <span className="absolute inset-0 grid place-items-center bg-black/30 transition group-hover:bg-black/10">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-butaca-500/90 pl-1 text-lg shadow-lg">▶</span>
                    </span>
                    <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] uppercase tracking-wider">
                      {VIDEO_TYPES[v.type] || v.type}{v.lang === 'es' ? ' · ES' : v.lang === 'en' ? ' · VO' : ''}
                    </span>
                  </span>
                  <span className="mt-2 line-clamp-2 block text-sm text-zinc-300 group-hover:text-white">{v.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {movie.saga && <MovieRow title={movie.saga.name} movies={movie.saga.movies} />}
      {movie.similar.length > 0 && <MovieRow title="Si te gusta, prueba con…" movies={movie.similar} />}

      {editing && (
        <WatchedModal
          movie={{ tmdbId: movie.id, title: movie.title, poster: movie.poster, year: movie.year }}
          entry={entry}
          onSaved={setEntry}
          onDeleted={() => setEntry(null)}
          onClose={() => setEditing(false)}
        />
      )}

      {/* ---------- Ventana del tráiler ---------- */}
      {video && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4"
          onClick={() => setVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label={video.name}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setVideo(null)} className="mb-2 ml-auto block text-sm text-zinc-300 hover:text-white">
              Cerrar ✕
            </button>
            <div className="aspect-video overflow-hidden rounded-xl">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1`}
                title={video.name}
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

// Dirección, guion, música y fotografía (cada nombre lleva a su ficha)
function Crew({ crew }) {
  const rows = [
    ['Dirección', crew.directors],
    ['Guion', crew.writers],
    ['Música', crew.music],
    ['Fotografía', crew.photography],
  ].filter(([, people]) => people.length > 0);
  if (rows.length === 0) return null;

  return (
    <dl className="mt-5 grid max-w-3xl gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {rows.map(([label, people]) => (
        <div key={label} className="flex gap-2">
          <dt className="w-20 shrink-0 text-zinc-500">{label}</dt>
          <dd className="text-zinc-200">
            {people.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ', '}
                <Link to={`/persona/${p.id}`} className="hover:text-butaca-500 hover:underline">{p.name}</Link>
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
