import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useReducedMotion from '../hooks/useReducedMotion';
import Rating from './Rating';

const GAP = 12; // separación entre carteles (px)
const EDGE = 16; // margen izquierdo cuando align="start"

// Tamaño del cartel central según el ancho de pantalla
const cardWidthFor = (size, viewport) => {
  if (size === 'sm') return viewport < 640 ? 92 : 118;
  return viewport < 640 ? 150 : 196;
};

/**
 * Carrusel "con foco": la película central se ve más grande y nítida,
 * las laterales más pequeñas y apagadas según su distancia al centro.
 *
 * - Ratón: se arrastra con inercia y, al soltar, se centra sola en la más cercana.
 * - Táctil: deslizamiento nativo con "snap" al centro.
 * - Teclado: ← →. Clic en una lateral = la trae al centro; clic en la central = abre la ficha.
 * - Con "reducir movimiento" no hay escalado ni desplazamientos animados.
 * - align="start": el foco está a la izquierda (útil cuando hay texto encima alineado a la izquierda).
 */
export default function FocusCarousel({
  movies = [],
  size = 'md',
  showInfo = true,
  initialIndex = 2,
  onActiveChange,
  label = 'Carrusel de películas',
  align = 'center', // 'center': foco en el centro | 'start': foco a la izquierda (para el escaparate)
}) {
  const track = useRef(null);
  const cards = useRef([]);
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0, lastX: 0, lastT: 0, velocity: 0 });
  const frame = useRef(0);
  const reduced = useReducedMotion();

  const [active, setActive] = useState(0);
  const [cardW, setCardW] = useState(cardWidthFor(size, 1280));
  const [pad, setPad] = useState(0);
  const isStart = align === 'start';

  // Punto de la pantalla (en coordenadas del scroll) donde está el "foco"
  const focusPoint = (el) => (isStart ? el.scrollLeft + EDGE + cardW / 2 : el.scrollLeft + el.clientWidth / 2);

  // ---------- Medidas: ancho de cartel y margen lateral para poder centrar el primero y el último ----------
  useLayoutEffect(() => {
    const measure = () => {
      const el = track.current;
      if (!el) return;
      const w = cardWidthFor(size, window.innerWidth);
      setCardW(w);
      setPad(Math.max(16, (el.clientWidth - w) / 2));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [size]);

  // ---------- Pinta escala/opacidad de cada cartel según su distancia al centro ----------
  const paint = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const center = focusPoint(el);
    let best = 0;
    let bestDist = Infinity;

    cards.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center) / (card.offsetWidth + GAP); // en "tarjetas"
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
      const t = Math.min(dist, 2);
      card.style.transform = reduced ? 'none' : `scale(${1 - t * 0.11})`; // 1 → 0.89 → 0.78
      card.style.opacity = String(1 - t * 0.27); // 1 → 0.73 → 0.46
      card.style.zIndex = String(10 - Math.round(t * 2));
    });

    setActive((prev) => (prev === best ? prev : best));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, isStart, cardW]);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
  };

  // ---------- Ir a una película concreta ----------
  const goTo = useCallback(
    (i, smooth = true) => {
      const el = track.current;
      const card = cards.current[i];
      if (!el || !card) return;
      el.scrollTo({
        left: isStart ? card.offsetLeft - EDGE : card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2,
        behavior: smooth && !reduced ? 'smooth' : 'auto',
      });
    },
    [reduced, isStart]
  );

  // Posición inicial (sin animación) cuando llegan las películas o cambia el tamaño
  useLayoutEffect(() => {
    if (!movies.length) return;
    goTo(Math.min(initialIndex, movies.length - 1), false);
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies, pad]);

  useEffect(() => {
    if (movies[active]) onActiveChange?.(movies[active], active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, movies]);

  // ---------- Arrastre con ratón (el táctil lo hace el navegador) ----------
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = track.current;
    drag.current = { down: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft, lastX: e.clientX, lastT: performance.now(), velocity: 0 };
    el.style.scrollSnapType = 'none'; // sin "snap" mientras arrastramos
    el.style.scrollBehavior = 'auto';
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5 && !d.moved) {
      d.moved = true;
      track.current.setPointerCapture?.(e.pointerId);
    }
    track.current.scrollLeft = d.startLeft - dx;
    // Velocidad para la inercia (px/ms)
    const now = performance.now();
    const dt = now - d.lastT || 1;
    d.velocity = 0.8 * ((d.lastX - e.clientX) / dt) + 0.2 * d.velocity;
    d.lastX = e.clientX;
    d.lastT = now;
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    const el = track.current;

    // Inercia: proyectamos hacia dónde iría y centramos la película más cercana a ese punto
    const projected = focusPoint(el) + (reduced ? 0 : d.velocity * 220);
    let target = active;
    let bestDist = Infinity;
    cards.current.forEach((card, i) => {
      if (!card) return;
      const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - projected);
      if (dist < bestDist) {
        bestDist = dist;
        target = i;
      }
    });
    el.style.scrollBehavior = '';
    goTo(target);
    // Reactivamos el snap cuando ha terminado el desplazamiento suave
    setTimeout(() => {
      if (track.current) track.current.style.scrollSnapType = '';
    }, 450);
  };

  // Si se ha arrastrado, el "clic" de soltar no debe abrir la ficha
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(Math.min(active + 1, movies.length - 1));
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(Math.max(active - 1, 0));
    }
  };

  const current = movies[active];

  return (
    <div className="relative" role="region" aria-roledescription="carrusel" aria-label={label}>
      <div className="relative">
        <div
          ref={track}
          tabIndex={0}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
          onClickCapture={onClickCapture}
          onKeyDown={onKeyDown}
          className={`relative flex cursor-grab snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain py-4 outline-none select-none active:cursor-grabbing [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-butaca-500/60 [&::-webkit-scrollbar]:hidden ${
            isStart
              ? '[mask-image:linear-gradient(to_right,black_80%,transparent)]'
              : '[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]'
          }`}
          style={
            isStart
              ? { gap: GAP, paddingLeft: EDGE, paddingRight: pad * 2 - EDGE, scrollPaddingLeft: EDGE }
              : { gap: GAP, paddingInline: pad }
          }
        >
          {movies.map((m, i) => (
            <Link
              key={m.id}
              ref={(el) => (cards.current[i] = el)}
              to={`/pelicula/${m.id}`}
              draggable="false"
              onClick={(e) => {
                // Clic en una lateral: primero la traemos al centro
                if (i !== active) {
                  e.preventDefault();
                  goTo(i);
                }
              }}
              aria-label={`${m.title}${i === active ? '' : ' (traer al centro)'}`}
              aria-current={i === active ? 'true' : undefined}
              className={`relative shrink-0 overflow-hidden rounded-xl bg-telon ring-1 ring-white/10 will-change-transform ${isStart ? 'snap-start origin-left' : 'snap-center origin-center'}`}
              style={{
                width: cardW,
                aspectRatio: '2 / 3',
                transition: reduced ? 'none' : 'transform 220ms cubic-bezier(.2,.7,.3,1), opacity 220ms ease-out, box-shadow 220ms',
                boxShadow: i === active ? '0 18px 40px -12px rgba(200,30,58,.45)' : 'none',
              }}
            >
              {m.poster ? (
                <img src={m.poster} alt="" loading="lazy" draggable="false" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center p-2 text-center text-xs text-zinc-400">{m.title}</span>
              )}
              {size !== 'sm' && m.rating && (
                <span className="absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs backdrop-blur">
                  <Rating value={m.rating} />
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Flechas (alternativa al arrastre) */}
        <CarouselArrow dir="prev" disabled={active === 0} onClick={() => goTo(active - 1)} />
        <CarouselArrow dir="next" disabled={active >= movies.length - 1} onClick={() => goTo(active + 1)} />
      </div>

      {/* Información de la película central */}
      {showInfo && current && (
        <div key={current.id} className="mt-1 text-center motion-safe:animate-[fade-up_220ms_ease-out]" aria-live="polite">
          <Link to={`/pelicula/${current.id}`} className="font-semibold hover:text-butaca-500">{current.title}</Link>
          <p className="text-sm text-zinc-500">{current.year || 'Sin fecha'}</p>
        </div>
      )}

      {/* Indicador de posición */}
      {movies.length > 1 && movies.length <= 24 && (
        <div className={`mt-3 flex gap-1.5 ${isStart ? 'justify-start px-4' : 'justify-center'}`} aria-hidden="true">
          {movies.map((m, i) => (
            <button
              key={m.id}
              tabIndex={-1}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${i === active ? 'w-5 bg-butaca-500' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CarouselArrow({ dir, disabled, onClick }) {
  const prev = dir === 'prev';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={prev ? 'Película anterior' : 'Película siguiente'}
      className={`absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/70 text-white shadow-xl backdrop-blur transition hover:border-butaca-500 hover:bg-butaca-500 disabled:pointer-events-none disabled:opacity-0 sm:grid ${
        prev ? 'left-2' : 'right-2'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={prev ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}
