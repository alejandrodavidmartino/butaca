import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGroupActivity } from '../services/groups';
import { getErrorMessage } from '../services/api';
import Avatar from './Avatar';
import ScoreBadge from './ScoreBadge';

// "hace 5 min", "ayer", "12 mar"
const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
function timeAgo(date) {
  const s = (Date.now() - new Date(date)) / 1000;
  if (s < 60) return 'ahora mismo';
  if (s < 3600) return rtf.format(-Math.floor(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), 'hour');
  if (s < 86400 * 7) return rtf.format(-Math.floor(s / 86400), 'day');
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const ICONS = {
  created: '🎉', joined: '👋', member_added: '➕', left: '🚪', kicked: '🚪', movie_added: '🍿',
  movie_watched: '👀', movie_rated: '⭐', movie_removed: '🗑️', roulette: '🎰', photo_changed: '📷', renamed: '✏️',
};

const Who = ({ user, me }) =>
  user ? (
    <Link to={`/u/${user.username}`} className="font-semibold text-zinc-100 hover:text-butaca-500">
      {user._id === me._id ? 'Tú' : user.name.split(' ')[0]}
    </Link>
  ) : (
    <span className="font-semibold text-zinc-400">Antiguo miembro</span>
  );

const Movie = ({ movie }) => (
  <Link to={`/pelicula/${movie.tmdbId}`} className="font-medium text-zinc-100 hover:text-butaca-500">{movie.title}</Link>
);

// La frase de cada tipo de actividad
function Sentence({ a, me }) {
  const who = <Who user={a.user} me={me} />;
  const mine = a.user?._id === me._id; // para conjugar: "Tú añadiste" / "Pablo añadió"
  const v = (yo, el) => (mine ? yo : el);
  const target = <Who user={a.target} me={me} />;

  switch (a.type) {
    case 'created': return <>{who} {v('creaste', 'creó')} el grupo</>;
    case 'joined': return <>{who} {v('entraste', 'entró')} en el grupo</>;
    case 'member_added': return <>{who} {v('añadiste', 'añadió')} a {target}</>;
    case 'left': return <>{who} {v('saliste', 'salió')} del grupo</>;
    case 'kicked': return <>{who} {v('sacaste', 'sacó')} a {target} del grupo</>;
    case 'movie_added': return <>{who} {v('añadiste', 'añadió')} <Movie movie={a.movie} /></>;
    case 'movie_watched': return <>{who} {v('marcaste', 'marcó')} <Movie movie={a.movie} /> como vista</>;
    case 'movie_rated': return <>{who} {v('puntuaste', 'puntuó')} <Movie movie={a.movie} /></>;
    case 'movie_removed': return <>{who} {v('quitaste', 'quitó')} {a.movie.title}</>;
    case 'roulette': return mine ? <>Tu ruleta eligió <Movie movie={a.movie} /></> : <>La ruleta de {who} eligió <Movie movie={a.movie} /></>;
    case 'photo_changed': return <>{who} {v('cambiaste', 'cambió')} la foto del grupo</>;
    case 'renamed': return <>{who} {v('renombraste', 'renombró')} el grupo a «{a.data?.name}»</>;
    default: return null;
  }
}

// Historial del grupo. refreshKey cambia cuando el grupo cambia -> volvemos a pedir lo último
export default function GroupActivity({ groupId, me, refreshKey }) {
  const [items, setItems] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGroupActivity(groupId)
      .then((r) => {
        if (cancelled) return;
        setItems(r.items);
        setHasMore(r.hasMore);
        setError('');
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [groupId, refreshKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await getGroupActivity(groupId, items[items.length - 1].createdAt);
      setItems([...items, ...r.items]);
      setHasMore(r.hasMore);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-telon p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">📜 Actividad</h2>
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}
      {!items && !error && (
        <div className="mt-3 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-white/5" />)}
        </div>
      )}
      {items?.length === 0 && <p className="mt-3 text-sm text-zinc-500">Todavía no ha pasado nada en este grupo.</p>}
      {items?.length > 0 && (
        <ol className="relative mt-4 space-y-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-white/10">
          {items.map((a) => (
            <li key={a._id} className="relative flex gap-3">
              <span className="relative block h-8 w-8 shrink-0">
                <Avatar user={a.user || { name: '?' }} size="h-8 w-8 text-xs" className="ring-2 ring-telon" />
                <span className="absolute -bottom-1 -right-1.5 text-xs leading-none" aria-hidden="true">{ICONS[a.type]}</span>
              </span>
              <div className="min-w-0 flex-1 text-sm leading-snug text-zinc-300">
                <p>
                  <Sentence a={a} me={me} />
                  {a.type === 'movie_rated' && a.data?.score != null && (
                    <span className="ml-1 inline-block align-middle"><ScoreBadge score={a.data.score} size="h-5 min-w-5 text-[11px]" /></span>
                  )}
                </p>
                <time dateTime={a.createdAt} title={new Date(a.createdAt).toLocaleString('es-ES')} className="text-xs text-zinc-500">
                  {timeAgo(a.createdAt)}
                </time>
              </div>
              {a.movie?.poster && (
                <Link to={`/pelicula/${a.movie.tmdbId}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                  <img src={a.movie.poster} alt="" loading="lazy" className="h-12 w-8 rounded object-cover ring-1 ring-white/10" />
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
      {hasMore && (
        <button onClick={loadMore} disabled={loadingMore} className="mt-4 w-full rounded-lg py-2 text-sm text-butaca-500 hover:bg-white/5">
          {loadingMore ? 'Cargando…' : 'Ver más'}
        </button>
      )}
    </div>
  );
}
