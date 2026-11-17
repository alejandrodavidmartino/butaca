import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recommendForGroup } from '../services/ai';
import { getErrorMessage } from '../services/api';
import Ratatus from './Ratatus';
import Rating from './Rating';
import PlatformBadges from './PlatformBadges';
import { useAuth } from '../context/AuthContext';

// Frases que va diciendo Ratatús mientras Gemini piensa
const THINKING = [
  'Psst… dejadme que olfatee vuestras notas…',
  'Rebuscando debajo de las butacas…',
  'Repasando las palomitas que se os cayeron…',
  'Consultando con mis primos de la filmoteca…',
  'Mmm… esto huele a peliculón…',
];

// Pop-up "Recomendaciones de Ratatús": la mascota sube desde abajo, piensa
// y presenta las películas una a una en un carrusel.
export default function RatatusPopup({ group, onClose, onAdd }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const [index, setIndex] = useState(0);
  const [phrase, setPhrase] = useState(0);
  const [added, setAdded] = useState({});
  const { user } = useAuth();
  const inGroup = new Set(group.movies.map((m) => m.tmdbId));

  const ask = useCallback(async () => {
    setState({ loading: true, data: null, error: '' });
    setIndex(0);
    try {
      setState({ loading: false, data: await recommendForGroup(group._id), error: '' });
    } catch (err) {
      setState({ loading: false, data: null, error: getErrorMessage(err) });
    }
  }, [group._id]);

  useEffect(() => {
    ask();
  }, [ask]);

  // Cambia la frase de "pensando" cada 1,8 s
  useEffect(() => {
    if (!state.loading) return;
    const t = setInterval(() => setPhrase((p) => (p + 1) % THINKING.length), 1800);
    return () => clearInterval(t);
  }, [state.loading]);

  // Escape para cerrar, flechas para el carrusel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (!state.data) return;
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, state.data.recommendations.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, state.data]);

  const add = async (tmdbId) => {
    try {
      await onAdd(tmdbId);
      setAdded((a) => ({ ...a, [tmdbId]: true }));
    } catch (err) {
      setState((s) => ({ ...s, error: getErrorMessage(err) }));
    }
  };

  const recs = state.data?.recommendations || [];
  const movie = recs[index];
  const mood = state.loading ? 'thinking' : state.error ? 'idle' : 'happy';

  // Lo que dice Ratatús en el bocadillo
  const speech = state.loading
    ? THINKING[phrase]
    : state.error
      ? `¡Ay! ${state.error}`
      : movie
        ? movie.reason
        : state.data?.message || 'Hoy no se me ocurre nada… ¡probad otra vez!';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recomendaciones de Ratatús"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-telon shadow-2xl sm:rounded-3xl"
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 text-zinc-400 hover:text-white" aria-label="Cerrar">✕</button>

        {/* ---------- Cabecera ---------- */}
        <header className="px-6 pt-6 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-butaca-500">Recomendaciones de</p>
          <h2 className="font-display text-5xl leading-none tracking-wide">Ratatús</h2>
          <p className="text-sm text-zinc-400">Nuestra rata experta en cine · vive bajo las butacas y lo ha visto todo</p>
        </header>

        {/* ---------- Ratatús + bocadillo ---------- */}
        <div className="mt-4 flex flex-col items-center gap-2 px-6 sm:flex-row sm:items-end sm:gap-4">
          <div className="w-32 shrink-0 animate-[ratatus-rise_700ms_cubic-bezier(.2,.9,.3,1.2)] sm:w-40">
            <Ratatus mood={mood} />
          </div>
          <div className="relative mb-4 w-full rounded-2xl border border-white/10 bg-white px-5 py-4 text-zinc-900 shadow-lg sm:mb-10" aria-live="polite">
            {/* Pico del bocadillo */}
            <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white sm:-left-2 sm:top-auto sm:bottom-6 sm:translate-x-0" />
            {movie && !state.loading && (
              <p className="relative text-xs font-semibold uppercase tracking-widest text-butaca-600">
                Idea {index + 1} de {recs.length}
              </p>
            )}
            <p key={speech} className="relative animate-[pop_350ms_ease-out] text-base font-medium leading-snug">
              «{speech}»
            </p>
          </div>
        </div>

        {/* ---------- Mensaje general del grupo ---------- */}
        {state.data?.message && (
          <p className="mx-6 rounded-xl bg-white/5 px-4 py-2 text-sm italic text-zinc-300">
            🐀 Ratatús opina de vuestro grupo: «{state.data.message}»
          </p>
        )}

        {/* ---------- Carrusel de películas ---------- */}
        <div className="p-6">
          {state.loading && (
            <div className="flex gap-4">
              <div className="aspect-[2/3] w-40 animate-pulse rounded-xl bg-white/5" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-7 w-2/3 animate-pulse rounded bg-white/5" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          )}

          {movie && (
            <div key={movie.id} className="flex animate-[slide-in_350ms_ease-out] flex-col gap-5 sm:flex-row">
              <Link to={`/pelicula/${movie.id}`} className="mx-auto w-44 shrink-0 sm:mx-0">
                {movie.poster ? (
                  <img src={movie.poster} alt={`Cartel de ${movie.title}`} className="w-full rounded-xl shadow-xl ring-1 ring-white/10" />
                ) : (
                  <div className="grid aspect-[2/3] place-items-center rounded-xl bg-sala text-4xl">🎬</div>
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <h3 className="font-display text-4xl leading-none tracking-wide">{movie.title}</h3>
                <p className="mt-1 flex items-center gap-3 text-sm text-zinc-400">
                  {movie.year} <Rating value={movie.rating} />
                </p>
                {movie.overview && <p className="mt-3 line-clamp-4 text-sm text-zinc-300">{movie.overview}</p>}
                {movie.platforms && <PlatformBadges platforms={movie.platforms} highlight={user?.platforms} className="mt-3" />}
                <div className="mt-4 flex flex-wrap gap-2">
                  {inGroup.has(movie.id) || added[movie.id] ? (
                    <span className="inline-flex items-center rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">✓ En la lista del grupo</span>
                  ) : (
                    <button onClick={() => add(movie.id)} className="btn-primary">＋ Añadir al grupo</button>
                  )}
                  <Link to={`/pelicula/${movie.id}`} className="btn-ghost">Ver ficha</Link>
                </div>
              </div>
            </div>
          )}

          {/* Controles del carrusel */}
          {recs.length > 0 && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={() => setIndex(index - 1)} disabled={index === 0} className="btn-ghost" aria-label="Idea anterior">←</button>
              <div className="flex gap-2">
                {recs.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => setIndex(i)}
                    aria-label={`Ver idea ${i + 1}: ${r.title}`}
                    aria-current={i === index}
                    className={`h-2.5 rounded-full transition-all ${i === index ? 'w-8 bg-butaca-500' : 'w-2.5 bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
              {index < recs.length - 1 ? (
                <button onClick={() => setIndex(index + 1)} className="btn-ghost" aria-label="Idea siguiente">→</button>
              ) : (
                <button onClick={ask} className="btn-ghost text-xs">🔄 Más ideas</button>
              )}
            </div>
          )}

          {state.error && (
            <div className="text-center">
              <button onClick={ask} className="btn-primary">Volver a intentarlo</button>
            </div>
          )}
        </div>

        <p className="pb-4 text-center text-[11px] text-zinc-600">Ratatús usa Google Gemini. Hasta las ratas se equivocan.</p>
      </div>
    </div>
  );
}
