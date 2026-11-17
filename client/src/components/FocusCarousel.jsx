import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useReducedMotion from '../hooks/useReducedMotion';
import Rating from './Rating';

const GAP = 12; // separación entre carteles (px)
const EDGE = 16; // margen izquierdo cuando align="start"
const COPIES = 3; // para el bucle infinito pintamos la lista 3 veces y nos movemos en la del medio

// Tamaño del cartel central según el ancho de pantalla
const cardWidthFor = (size, viewport) => {
  if (size === 'sm') return viewport < 640 ? 92 : 118;
  return viewport < 640 ? 150 : 196;
};

/**
 * Carrusel "con foco": la película central se ve más grande, las laterales algo más pequeñas
 * y suaves según su distancia al centro (sin oscurecer demasiado, para no cansar la vista).
 *
 * - Infinito: al pasar de la última se vuelve a la primera (y al revés).
 * - Ratón: se arrastra con inercia y, al soltar, se centra sola en la más cercana.
 * - Táctil: deslizamiento nativo con "snap".
 * - Teclado: ← →. Clic en una lateral = la trae al foco; clic en la del foco = abre la ficha.
 * - Con "reducir movimiento" no hay escalado ni desplazamientos animados.
 * - align="start": el foco está a la izquierda (para el escaparate, alineado con el texto).
 *
 * Cómo funciona el bucle: pintamos [lista, lista, lista]. Siempre que el carrusel se detiene
 * fuera de la copia central, saltamos sin animación a la misma película de la copia central.
 * Como las tres copias son idénticas, el salto es invisible.
 */
export default function FocusCarousel({
  movies = [],
  size = 'md',
  showInfo = true,
  initialIndex = 2,
  onActiveChange,
  label = 'Carrusel de películas',
  align = 'center',
}) {
  const track = useRef(null);
  const cards = useRef([]);
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0, lastX: 0, lastT: 0, velocity: 0 });
  const frame = useRef(0);
  const settleTimer = useRef(0);
  const reduced = useReducedMotion();

  const n = movies.length;
  const loop = n >= 4; // con muy pocas películas no tiene sentido el bucle
  const items = useMemo(() => (loop ? Array.from({ length: COPIES }, () => movies).flat() : movies), [movies, loop]);
  const offset = loop ? n : 0; // índice donde empieza la copia central

  const [active, setActive] = useState(offset); // índice dentro de "items"
  const [cardW, setCardW] = useState(cardWidthFor(size, 1280));
  const [pad, setPad] = useState(0);
  const isStart = align === 'start';
  const real = n ? ((active % n) + n) % n : 0; // índice real en "movies"

  // Punto (en coordenadas del scroll) donde está el foco
  const focusPoint = useCallback(
    (el) => (isStart ? el.scrollLeft + EDGE + cardW / 2 : el.scrollLeft + el.clientWidth / 2),
    [isStart, cardW]
  );

  // ---------- Medidas ----------
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

  // ---------- Escala y opacidad según la distancia al foco ----------
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
      card.style.transform = reduced ? 'none' : `scale(${1 - t * 0.08})`; // 1 → 0.92 → 0.84
      card.style.opacity = String(1 - t * 0.1); // 1 → 0.9 → 0.8 (suave para la vista)
      card.style.zIndex = String(10 - Math.round(t * 2));
    });

    setActive((prev) => (prev === best ? prev : best));
  }, [reduced, focusPoint]);

  // Posición de scroll que pone la tarjeta i en el foco
  const leftFor = useCallback(
    (i) => {
      const el = track.current;
      const card = cards.current[i];
      if (!el || !card) return null;
      return isStart ? card.offsetLeft - EDGE : card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;
    },
    [isStart]
  );

  const goTo = useCallback(
    (i, smooth = true) => {
      const left = leftFor(i);
      if (left == null) return;
      track.current.scrollTo({ left, behavior: smooth && !reduced ? 'smooth' : 'auto' });
    },
    [leftFor, reduced]
  );

  // ---------- Bucle: si nos paramos fuera de la copia central, saltamos a ella sin que se note ----------
  const recenter = useCallback(() => {
    const el = track.current;
    if (!loop || !el || drag.current.down) return;
    const center = focusPoint(el);
    // Índice más cercano al foco ahora mismo
    let current = 0;
    let bestDist = Infinity;
    cards.current.forEach((card, i) => {
      if (!card) return;
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (d < bestDist) {
        bestDist = d;
        current = i;
      }
    });
    if (current >= n && current < 2 * n) return; // ya estamos en la copia central

    const target = current < n ? current + n : current - n;
    const shift = cards.current[target].offsetLeft - cards.current[current].offsetLeft;
    // Sin transiciones ni "snap" durante el salto para que sea invisible
    el.dataset.jumping = 'true';
    el.style.scrollSnapType = 'none';
    el.style.scrollBehavior = 'auto';
    el.scrollLeft += shift;
    paint();
    requestAnimationFrame(() => {
      el.style.scrollSnapType = '';
      el.style.scrollBehavior = '';
      delete el.dataset.jumping;
    });
  }, [loop, n, focusPoint, paint]);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
    // Cuando el desplazamiento se detiene, comprobamos si hay que "dar la vuelta"
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(recenter, 160);
  };

  // Posición inicial (sin animación) en la copia central
  useLayoutEffect(() => {
    if (!n) return;
    goTo(offset + Math.min(initialIndex, n - 1), false);
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies, pad]);

  useEffect(() => {
    if (movies[real]) onActiveChange?.(movies[real], real);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [real, movies]);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  // ---------- Arrastre con ratón (el táctil lo hace el navegador) ----------
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = track.current;
    drag.current = { down: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft, lastX: e.clientX, lastT: performance.now(), velocity: 0 };
    el.style.scrollSnapType = 'none';
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

    // Inercia: proyectamos hacia dónde iría y llevamos al foco la tarjeta más cercana a ese punto
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
    setTimeout(() => {
      if (track.current) track.current.style.scrollSnapType = '';
    }, 450);
  };

  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  // Siguiente / anterior (con bucle; sin bucle se detiene en los extremos)
  const step = (dir) => {
    const next = active + dir;
    if (!loop && (next < 0 || next >= n)) return;
    goTo(next);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    }
  };

  // Salto desde los puntos: a la copia más cercana de esa película
  const jumpTo = (i) => {
    const base = active - real;
    goTo(base + i);
  };

  const current = movies[real];

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
          className={`group/track relative flex cursor-grab snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain py-4 outline-none select-none active:cursor-grabbing [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-butaca-500/60 [&::-webkit-scrollbar]:hidden ${
            isStart
              ? '[mask-image:linear-gradient(to_right,black_85%,transparent)]'
              : '[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]'
          }`}
          style={
            isStart
              ? { gap: GAP, paddingLeft: EDGE, paddingRight: pad * 2 - EDGE, scrollPaddingLeft: EDGE }
              : { gap: GAP, paddingInline: pad }
          }
        >
          {items.map((m, i) => {
            const isClone = loop && (i < n || i >= 2 * n);
            const isActive = i === active;
            return (
              <Link
                key={`${m.id}-${i}`}
                ref={(el) => (cards.current[i] = el)}
                to={`/pelicula/${m.id}`}
                draggable="false"
                tabIndex={isClone ? -1 : undefined}
                aria-hidden={isClone || undefined}
                onClick={(e) => {
                  // Clic en una lateral: primero la traemos al foco
                  if (!isActive) {
                    e.preventDefault();
                    goTo(i);
                  }
                }}
                aria-label={`${m.title}${isActive ? '' : ' (traer al centro)'}`}
                aria-current={isActive ? 'true' : undefined}
                className={`relative shrink-0 overflow-hidden rounded-xl bg-telon ring-1 ring-white/10 will-change-transform group-data-[jumping]/track:!transition-none ${
                  isStart ? 'snap-start origin-left' : 'snap-center origin-center'
                }`}
                style={{
                  width: cardW,
                  aspectRatio: '2 / 3',
                  transition: reduced ? 'none' : 'transform 220ms cubic-bezier(.2,.7,.3,1), opacity 220ms ease-out, box-shadow 220ms',
                  boxShadow: isActive ? '0 18px 40px -12px rgba(200,30,58,.45)' : 'none',
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
            );
          })}
        </div>

        <CarouselArrow dir="prev" disabled={!loop && real === 0} onClick={() => step(-1)} />
        <CarouselArrow dir="next" disabled={!loop && real >= n - 1} onClick={() => step(1)} />
      </div>

      {/* Información de la película en el foco */}
      {showInfo && current && (
        <div key={current.id} className="mt-1 text-center motion-safe:animate-[fade-up_220ms_ease-out]" aria-live="polite">
          <Link to={`/pelicula/${current.id}`} className="font-semibold hover:text-butaca-500">{current.title}</Link>
          <p className="text-sm text-zinc-500">{current.year || 'Sin fecha'}</p>
        </div>
      )}

      {/* Indicador de posición */}
      {n > 1 && n <= 24 && (
        <div className={`mt-3 flex gap-1.5 ${isStart ? 'justify-start px-4' : 'justify-center'}`} aria-hidden="true">
          {movies.map((m, i) => (
            <button
              key={m.id}
              tabIndex={-1}
              onClick={() => jumpTo(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${i === real ? 'w-5 bg-butaca-500' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
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
