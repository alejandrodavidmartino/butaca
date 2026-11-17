import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

const STRIP_LENGTH = 70; // nº de carteles en la tira
const WIN_INDEX = 60;    // posición donde colocamos la ganadora (cerca del final)
const GAP = 12;          // separación entre carteles (px)
const SPIN_MS = 6500;    // duración del giro

// Baraja un array (algoritmo de Fisher-Yates)
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Mismos filtros que aplica el servidor, para que la tira muestre solo candidatas
const matches = (m, { maxRuntime, genre }) =>
  !m.watched &&
  (!maxRuntime || !m.runtime || m.runtime <= Number(maxRuntime)) &&
  (!genre || m.genres.includes(genre));

// Carrusel tipo "tragaperras": la tira de carteles se desplaza rápido y va frenando
// hasta pararse en la película elegida, que se hace más grande.
// La película la elige el SERVIDOR; la animación es solo el espectáculo.
export default function RandomPicker({ group, onClose, onWatched }) {
  const pending = useMemo(() => group.movies.filter((m) => !m.watched), [group.movies]);
  const genres = useMemo(() => [...new Set(pending.flatMap((m) => m.genres))].sort(), [pending]);

  const [filters, setFilters] = useState({ maxRuntime: '', genre: '' });
  const candidates = useMemo(() => pending.filter((m) => matches(m, filters)), [pending, filters]);

  const [strip, setStrip] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | spinning | done
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');

  const viewport = useRef(null);
  const [cardW, setCardW] = useState(150);

  // Tamaño de cartel según el ancho disponible (más pequeño en móvil)
  useLayoutEffect(() => {
    const w = viewport.current?.offsetWidth || 600;
    setCardW(w < 480 ? 104 : 150);
  }, []);

  // Tira de "reposo" para que se vea algo antes de girar
  useEffect(() => {
    if (phase === 'idle') setStrip(buildStrip(candidates, null));
  }, [candidates, phase]);

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const spin = async () => {
    setError('');
    let result;
    try {
      result = await randomFromGroup(group._id, {
        maxRuntime: filters.maxRuntime || undefined,
        genre: filters.genre || undefined,
      });
    } catch (err) {
      return setError(getErrorMessage(err));
    }

    // 1) Nueva tira con la ganadora en WIN_INDEX y volvemos al principio SIN animación
    const pool = candidates.length ? candidates : [result.movie];
    setStrip(buildStrip(pool, result.movie));
    setWinner(null);
    setAnimate(false);
    setOffset(0);
    setPhase('spinning');

    // 2) En el siguiente frame activamos la transición y movemos hasta la ganadora.
    //    Paramos en un punto aleatorio DENTRO del cartel ganador (no siempre en el centro)
    //    para que a veces parezca que "casi" cae en la de al lado.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const step = cardW + GAP;
        const center = viewport.current.offsetWidth / 2;
        const jitter = (Math.random() - 0.5) * (cardW * 0.8);
        setAnimate(true);
        setOffset(WIN_INDEX * step + cardW / 2 + jitter - center);
      })
    );
  };

  // Cuando termina la transición CSS, mostramos la ganadora
  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || phase !== 'spinning') return;
    setPhase('done');
    setWinner(strip[WIN_INDEX]);
  };

  const spinMs = reducedMotion ? 800 : SPIN_MS;

  return (
    <Modal title="🎲 Película aleatoria" onClose={onClose} wide>
      {/* ---------- Filtros ---------- */}
      {phase === 'idle' && (
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

      {/* ---------- Carrusel ---------- */}
      <div
        ref={viewport}
        className="relative -mx-6 mt-6 overflow-hidden bg-sala py-8"
        style={{ height: cardW * 1.5 + 64 }}
      >
        {/* Aguja central */}
        <div className={`pointer-events-none absolute inset-y-0 left-1/2 z-20 w-1 -translate-x-1/2 bg-butaca-500 shadow-[0_0_20px_4px] shadow-butaca-500/70 transition-opacity duration-500 ${phase === 'done' ? 'opacity-0' : ''}`} />
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent border-t-butaca-500" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 -translate-x-1/2 border-x-[10px] border-b-[12px] border-x-transparent border-b-butaca-500" />

        {/* Sombras laterales para dar profundidad */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-sala to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-sala to-transparent" />

        <ul
          className="flex will-change-transform"
          style={{
            gap: GAP,
            transform: `translateX(${-offset}px)`,
            // Curva que empieza muy rápido y frena muy despacio al final
            transition: animate ? `transform ${spinMs}ms cubic-bezier(0.08, 0.82, 0.17, 1)` : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
          aria-hidden={phase === 'spinning'}
        >
          {strip.map((m, i) => {
            const isWinner = phase === 'done' && i === WIN_INDEX;
            return (
              <li
                key={i}
                className={`relative shrink-0 overflow-hidden rounded-xl bg-telon ring-1 ring-white/10 transition-all duration-500 ${
                  isWinner
                    ? 'z-10 scale-[1.18] ring-4 ring-butaca-500 shadow-[0_0_50px_0] shadow-butaca-500/80'
                    : phase === 'done'
                      ? 'scale-90 opacity-30 grayscale'
                      : ''
                }`}
                style={{ width: cardW, height: cardW * 1.5 }}
              >
                {m.poster ? (
                  <img src={m.poster} alt="" draggable="false" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center p-2 text-center text-xs text-zinc-400">{m.title}</div>
                )}
              </li>
            );
          })}
        </ul>

        {phase === 'done' && <Confetti />}
      </div>

      {/* ---------- Resultado / botón ---------- */}
      <div className="mt-6 text-center" aria-live="polite">
        {phase === 'done' && winner ? (
          <div className="animate-[pop_400ms_ease-out]">
            <p className="text-sm uppercase tracking-widest text-butaca-500">Esta noche toca…</p>
            <h3 className="mt-1 font-display text-4xl tracking-wide sm:text-5xl">{winner.title}</h3>
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
            <p className="text-sm text-zinc-400">
              {phase === 'spinning'
                ? 'Que decida el destino…'
                : `${candidates.length} ${candidates.length === 1 ? 'candidata' : 'candidatas'} en «${group.name}»`}
            </p>
            <button
              onClick={spin}
              disabled={phase === 'spinning' || candidates.length === 0}
              className="btn-primary mt-4 px-8 py-3 text-base"
            >
              {phase === 'spinning' ? 'Girando…' : '🎲 ¡Girar!'}
            </button>
          </>
        )}
        {error && <p role="alert" className="alert-error mt-4">{error}</p>}
      </div>
    </Modal>
  );
}

// Construye la tira: candidatas barajadas repetidas, evitando dos iguales seguidas,
// y con la ganadora colocada en WIN_INDEX
function buildStrip(pool, winner) {
  if (pool.length === 0) return [];
  const strip = [];
  while (strip.length < STRIP_LENGTH) {
    for (const m of shuffle(pool)) {
      if (pool.length > 1 && strip.at(-1)?.tmdbId === m.tmdbId) continue;
      strip.push(m);
    }
  }
  strip.length = STRIP_LENGTH;
  if (winner) {
    strip[WIN_INDEX] = winner;
    // Que las vecinas no sean la misma película (quedaría raro)
    for (const i of [WIN_INDEX - 1, WIN_INDEX + 1]) {
      if (pool.length > 1 && strip[i].tmdbId === winner.tmdbId) {
        strip[i] = pool.find((m) => m.tmdbId !== winner.tmdbId);
      }
    }
  }
  return strip;
}

// Lluvia de confeti hecha con CSS (sin librerías)
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.2 + Math.random() * 1.2,
        color: ['#c81e3a', '#facc15', '#ffffff', '#34d399', '#60a5fa'][i % 5],
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 160,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 h-3 w-1.5 rounded-sm"
          style={{
            left: `${p.left}%`,
            background: p.color,
            '--drift': `${p.drift}px`,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
