import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyWatched, getWatchedStats } from '../services/watched';
import { getErrorMessage } from '../services/api';
import WatchedModal from '../components/WatchedModal';
import ScoreBadge from '../components/ScoreBadge';
import ErrorMessage from '../components/ErrorMessage';
import Ratatus from '../components/Ratatus';

const SORTS = [
  ['recent', 'Más recientes'],
  ['best', 'Mejor nota'],
  ['worst', 'Peor nota'],
  ['title', 'Título (A-Z)'],
];

const formatDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

// "Mis vistas": el diario de cine personal de cada usuario
export default function MyWatched() {
  const { user } = useAuth();
  const [movies, setMovies] = useState(null);
  const [stats, setStats] = useState(null);
  const [sort, setSort] = useState('recent');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = () => {
    getMyWatched({ sort, q: q.trim() || undefined }).then(setMovies).catch((err) => setError(getErrorMessage(err)));
    getWatchedStats().then(setStats).catch(() => {});
  };

  // Recarga al cambiar el orden o la búsqueda (con un pequeño retardo al escribir)
  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, q]);

  if (error) return <ErrorMessage message={error} />;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-butaca-500">Tu diario de cine</p>
      <h1 className="font-display text-5xl tracking-wide">Mis vistas</h1>
      <p className="text-zinc-400">Todo lo que has visto, {user.name.split(' ')[0]}, con tus notas. Es privado, salvo las reseñas que decidas publicar en la ficha de cada película.</p>

      {/* ---------- Estadísticas ---------- */}
      {stats && stats.count > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat value={stats.count} label={stats.count === 1 ? 'película vista' : 'películas vistas'} />
          <Stat value={`${stats.hours} h`} label="de cine" />
          <Stat value={stats.avgScore != null ? <ScoreBadge score={stats.avgScore} size="h-9 min-w-9 text-lg" /> : '—'} label={`tu nota media (${stats.rated} puntuadas)`} />
          <Stat value={stats.topGenre || '—'} label="tu género favorito" small />
        </div>
      )}

      {/* ---------- Controles ---------- */}
      {movies && (stats?.count > 0 || q) && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <label htmlFor="wq" className="sr-only">Buscar en mis vistas</label>
          <input id="wq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en mis vistas…" className="input max-w-xs" />
          <label htmlFor="wsort" className="text-sm text-zinc-400">Ordenar</label>
          <select id="wsort" value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto py-2">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      )}

      {/* ---------- Lista ---------- */}
      {!movies ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-telon" />)}
        </div>
      ) : movies.length === 0 ? (
        q ? (
          <p className="py-16 text-center text-zinc-400">No hay ninguna película con «{q}» en tus vistas.</p>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <div className="w-24"><Ratatus /></div>
            <p className="max-w-md text-zinc-300">
              «Psst… tu diario está vacío. Entra en la ficha de cualquier película y pulsa <strong>👁 La he visto</strong>.
              Cuantas más puntúes, mejor te conoceré.»
            </p>
            <Link to="/peliculas" className="btn-primary">Explorar películas</Link>
          </div>
        )
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {movies.map((m) => (
            <li key={m.tmdbId} className="group">
              <button onClick={() => setEditing(m)} className="relative block aspect-[2/3] w-full overflow-hidden rounded-xl bg-telon ring-1 ring-white/5 transition hover:ring-butaca-500/60" aria-label={`Editar ${m.title}`}>
                {m.poster ? <img src={m.poster} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center p-2 text-sm text-zinc-400">{m.title}</span>}
                <span className="absolute left-2 top-2">
                  {m.score != null ? (
                    <ScoreBadge score={m.score} />
                  ) : (
                    <span className="rounded-md bg-black/75 px-2 py-1 text-xs text-zinc-300">Sin nota</span>
                  )}
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-left text-xs text-zinc-200 opacity-0 transition group-hover:opacity-100">
                  ✎ Editar nota
                </span>
              </button>
              <Link to={`/pelicula/${m.tmdbId}`} className="mt-2 line-clamp-1 text-sm font-medium hover:text-butaca-500">{m.title}</Link>
              <p className="text-xs text-zinc-500">Vista el {formatDate(m.watchedAt)}</p>
              {m.comment && <p className="mt-1 line-clamp-2 text-xs italic text-zinc-400">«{m.comment}»</p>}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <WatchedModal
          movie={editing}
          entry={editing}
          onSaved={load}
          onDeleted={load}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function Stat({ value, label, small = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-telon p-4">
      <div className={`font-display tracking-wide ${small ? 'text-3xl' : 'text-4xl'}`}>{value}</div>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}
