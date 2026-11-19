import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovieReviews } from '../services/movies';
import { getErrorMessage } from '../services/api';
import Avatar from './Avatar';
import ScoreBadge, { scoreColor } from './ScoreBadge';

const formatDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
const SORTS = [['recent', 'Más recientes'], ['best', 'Mejor nota'], ['worst', 'Peor nota']];

// Valoraciones y reseñas de los usuarios de Butaca en la ficha de una película.
// me: usuario con sesión (o null) · myEntry: su entrada en «Mis vistas» (null si no la ha visto)
// onWrite: abre la ventana para escribir/editar su reseña
export default function MovieReviews({ tmdbId, me, myEntry, onWrite }) {
  const [sort, setSort] = useState('recent');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  // Se recarga al cambiar de película, de orden o cuando guardo mi reseña
  // (esperamos a saber si tengo entrada, para no pedirlo dos veces)
  const refreshKey = myEntry === undefined ? undefined : myEntry?.updatedAt || 'none';
  useEffect(() => {
    if (refreshKey === undefined) return;
    let cancelled = false;
    getMovieReviews(tmdbId, { sort })
      .then((d) => !cancelled && (setData(d), setError('')))
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [tmdbId, sort, refreshKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await getMovieReviews(tmdbId, { sort, page: data.page + 1 });
      setData({ ...next, reviews: [...data.reviews, ...next.reviews] });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const summary = data?.summary;
  const max = Math.max(...(summary?.distribution || [1]), 1);
  // Mi reseña va aparte, arriba; de la lista la quitamos para no repetirla
  const others = data?.reviews.filter((r) => r.user._id !== me?._id) || [];
  const myPublic = myEntry?.reviewPublic && !myEntry?.hiddenByAdmin;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="font-display text-3xl tracking-wide">Valoraciones de Butaca</h2>
      {error && <p role="alert" className="alert-error mt-4">{error}</p>}

      <div className="mt-4 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ---------- Resumen: nota media y reparto ---------- */}
        <div className="self-start rounded-2xl border border-white/10 bg-telon p-5">
          {!summary ? (
            <div className="h-48 animate-pulse rounded-xl bg-white/5" />
          ) : summary.count === 0 ? (
            <div className="py-6 text-center">
              <p className="text-4xl">🍿</p>
              <p className="mt-2 font-medium">Nadie la ha puntuado todavía</p>
              <p className="text-sm text-zinc-400">¿La has visto? Sé el primero.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <ScoreBadge score={summary.avg} size="h-16 min-w-16 text-3xl rounded-2xl" />
                <div>
                  <p className="font-semibold">Nota media de Butaca</p>
                  <p className="text-sm text-zinc-400">
                    {summary.count} {summary.count === 1 ? 'valoración' : 'valoraciones'} · {summary.reviews} {summary.reviews === 1 ? 'reseña' : 'reseñas'}
                  </p>
                </div>
              </div>
              <ol className="mt-5 space-y-1" aria-label="Reparto de notas">
                {[...summary.distribution].map((n, i) => ({ score: i + 1, n })).reverse().map(({ score, n }) => (
                  <li key={score} className="flex items-center gap-2 text-xs" title={`${n} ${n === 1 ? 'persona' : 'personas'} le dio un ${score}`}>
                    <span className="w-5 text-right tabular-nums text-zinc-400">{score}</span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <span className={`block h-full rounded-full ${scoreColor(score).split(' ')[0]}`} style={{ width: `${(n / max) * 100}%` }} />
                    </span>
                    <span className="w-6 tabular-nums text-zinc-500">{n || ''}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {/* Llamada a la acción */}
          <div className="mt-5 border-t border-white/10 pt-4">
            {!me ? (
              <Link to="/login" state={{ from: `/pelicula/${tmdbId}` }} className="btn-ghost w-full">Inicia sesión para opinar</Link>
            ) : myEntry === undefined ? null : (
              <button onClick={onWrite} className="btn-primary w-full">
                {myEntry?.comment || myEntry?.score != null ? '✎ Editar mi reseña' : '✍️ Escribir mi reseña'}
              </button>
            )}
          </div>
        </div>

        {/* ---------- Reseñas ---------- */}
        <div>
          {me && myEntry && (myEntry.comment || myEntry.score != null) && (
            <div className="mb-4">
              <ReviewCard
                review={{ ...myEntry, user: me }}
                mine
                note={
                  myEntry.hiddenByAdmin
                    ? '🚫 Un administrador ha ocultado tu reseña: no se muestra en la ficha.'
                    : myPublic
                      ? '🌍 Publicada: todo el mundo la ve.'
                      : '🔒 Privada: solo la ves tú. Tu nota cuenta en la media de forma anónima.'
                }
              />
            </div>
          )}

          {data && (data.reviews.length > 0 || data.summary.reviews > 0) && (
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm text-zinc-400">Lo que dicen otros usuarios</p>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="sr-only sm:not-sr-only">Ordenar</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto py-1.5 text-sm">
                  {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
            </div>
          )}

          {!data && !error && (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-telon" />)}</div>
          )}
          {data && others.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-zinc-400">
              {summary?.count > 0
                ? 'Hay notas, pero nadie más ha publicado una reseña todavía.'
                : 'Todavía no hay reseñas de esta película.'}
            </p>
          )}
          <ul className="space-y-3">
            {others.map((r) => <li key={r._id}><ReviewCard review={r} /></li>)}
          </ul>
          {data && data.page < data.pages && (
            <button onClick={loadMore} disabled={loadingMore} className="btn-ghost mt-4 w-full">
              {loadingMore ? 'Cargando…' : 'Ver más reseñas'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Una reseña: autor, nota, fecha y texto (oculto si tiene spoilers)
function ReviewCard({ review, mine, note }) {
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const long = review.comment?.length > 320;
  const hidden = review.spoiler && !showSpoiler && !mine;

  return (
    <article className={`rounded-2xl border p-4 ${mine ? 'border-butaca-500/40 bg-butaca-500/5' : 'border-white/10 bg-telon'}`}>
      <header className="flex items-center gap-3">
        <Link to={`/u/${review.user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar user={review.user} size="h-10 w-10 text-sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium hover:text-butaca-500">
              {review.user.name} {mine && <span className="text-xs font-normal text-butaca-500">· tu reseña</span>}
            </span>
            <span className="block text-xs text-zinc-500">@{review.user.username} · {formatDate(review.updatedAt || review.watchedAt)}</span>
          </span>
        </Link>
        {review.score != null && <ScoreBadge score={review.score} size="h-10 min-w-10 text-lg" />}
      </header>

      {review.comment &&
        (hidden ? (
          <button onClick={() => setShowSpoiler(true)} className="mt-3 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-left text-sm text-amber-200 hover:bg-amber-400/15">
            ⚠️ Esta reseña contiene spoilers. <span className="underline">Pulsa para leerla</span>
          </button>
        ) : (
          <>
            <p className={`mt-3 whitespace-pre-line leading-relaxed text-zinc-200 ${long && !expanded ? 'line-clamp-5' : ''}`}>
              {review.spoiler && <span className="mr-1 rounded bg-amber-400/15 px-1.5 py-0.5 text-[11px] text-amber-200">Spoiler</span>}
              {review.comment}
            </p>
            {long && (
              <button onClick={() => setExpanded(!expanded)} className="mt-1 text-sm text-butaca-500 hover:underline">
                {expanded ? 'Leer menos' : 'Leer más'}
              </button>
            )}
          </>
        ))}
      {note && <p className="mt-3 text-xs text-zinc-400">{note}</p>}
    </article>
  );
}
