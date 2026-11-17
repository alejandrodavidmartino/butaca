import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { randomFromGroup } from '../services/groups';
import { getErrorMessage } from '../services/api';
import Modal from './Modal';
import Avatar from './Avatar';
import Rating from './Rating';

const DURATIONS = [
  ['', 'Me da igual'],
  ['100', 'Menos de 1 h 40'],
  ['120', 'Menos de 2 h'],
  ['150', 'Menos de 2 h 30'],
];

// Ruleta: pasa carteles rápido y va frenando hasta pararse en la elegida.
// La película la elige el SERVIDOR; la animación es solo el "espectáculo".
export default function RandomPicker({ group, onClose, onWatched }) {
  const pending = group.movies.filter((m) => !m.watched);
  const genres = useMemo(() => [...new Set(pending.flatMap((m) => m.genres))].sort(), [pending]);

  const [filters, setFilters] = useState({ maxRuntime: '', genre: '' });
  const [spinning, setSpinning] = useState(false);
  const [shown, setShown] = useState(null); // cartel que se ve ahora mismo
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const spin = async () => {
    setError('');
    setWinner(null);
    let result;
    try {
      result = await randomFromGroup(group._id, {
        maxRuntime: filters.maxRuntime || undefined,
        genre: filters.genre || undefined,
      });
    } catch (err) {
      return setError(getErrorMessage(err));
    }

    // Animación: ~22 cambios de cartel, cada vez más lentos
    setSpinning(true);
    const steps = 22;
    let i = 0;
    const tick = () => {
      i++;
      if (i >= steps) {
        setShown(result.movie);
        setWinner(result.movie);
        setSpinning(false);
        return;
      }
      setShown(pending[Math.floor(Math.random() * pending.length)]);
      timer.current = setTimeout(tick, 40 + i * i * 0.9); // frenada progresiva
    };
    tick();
  };

  return (
    <Modal title="🎲 Película aleatoria" onClose={onClose} wide>
      {!winner && !spinning && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="rt" className="mb-1.5 block text-sm text-zinc-400">¿Cuánto tiempo tenéis?</label>
            <select id="rt" className="input" value={filters.maxRuntime}
              onChange={(e) => setFilters({ ...filters, maxRuntime: e.target.value })}>
              {DURATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rg" className="mb-1.5 block text-sm text-zinc-400">¿Algún género?</label>
            <select id="rg" className="input" value={filters.genre}
              onChange={(e) => setFilters({ ...filters, genre: e.target.value })}>
              <option value="">Cualquiera</option>
              {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ---------- Pantalla de la ruleta ---------- */}
      <div className="mt-6 flex flex-col items-center">
        <div
          className={`relative aspect-[2/3] w-52 overflow-hidden rounded-2xl bg-sala ring-4 transition ${
            winner ? 'ring-butaca-500 shadow-[0_0_60px_-10px] shadow-butaca-500' : 'ring-white/10'
          }`}
        >
          {shown?.poster ? (
            <img src={shown.poster} alt={winner ? `Cartel de ${shown.title}` : ''} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-6xl">{shown ? '🎬' : '❔'}</div>
          )}
        </div>

        {winner ? (
          <div className="mt-5 text-center" aria-live="polite">
            <p className="text-sm uppercase tracking-widest text-butaca-500">Esta noche toca…</p>
            <h3 className="mt-1 font-display text-4xl tracking-wide">{winner.title}</h3>
            <p className="mt-1 flex items-center justify-center gap-3 text-sm text-zinc-400">
              {winner.year} {winner.runtime ? `· ${winner.runtime} min` : ''} <Rating value={winner.rating} />
            </p>
            {winner.addedBy && (
              <p className="mt-2 flex items-center justify-center gap-2 text-sm text-zinc-400">
                <Avatar user={winner.addedBy} size="h-6 w-6 text-[10px]" /> Propuesta por @{winner.addedBy.username}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button onClick={spin} className="btn-ghost">🔄 Otra vez</button>
              <Link to={`/pelicula/${winner.tmdbId}`} className="btn-ghost">Ver ficha</Link>
              <button onClick={() => { onWatched(winner.tmdbId); onClose(); }} className="btn-primary">
                ✓ ¡La vemos! Marcar como vista
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-zinc-400">
              {pending.length} películas pendientes en «{group.name}»
            </p>
            <button onClick={spin} disabled={spinning || pending.length === 0} className="btn-primary mt-4 px-8 py-3 text-base">
              {spinning ? 'Girando…' : '🎲 ¡Girar la ruleta!'}
            </button>
          </>
        )}
        {error && <p role="alert" className="alert-error mt-4">{error}</p>}
      </div>
    </Modal>
  );
}
