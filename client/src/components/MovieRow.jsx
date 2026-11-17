import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';

// Carrusel horizontal de películas con flechas.
// - Las flechas avanzan "una página" (lo que cabe en pantalla) con desplazamiento suave.
// - Cada flecha solo aparece si se puede avanzar en esa dirección.
// - En móvil se sigue pudiendo deslizar con el dedo.
export default function MovieRow({ title, movies = [], link, loading }) {
  const track = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Comprueba si hay contenido a la izquierda / derecha
  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    el?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update, movies, loading]);

  // Desplaza casi el ancho visible (dejando asomar una tarjeta para dar contexto)
  const scroll = (dir) => {
    const el = track.current;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section className="mx-auto max-w-7xl py-6" aria-label={title}>
      <div className="mb-3 flex items-end justify-between px-4">
        <h2 className="font-display text-3xl tracking-wide">{title}</h2>
        {link && (
          <Link to={link} className="text-sm font-medium text-butaca-500 hover:underline">Ver todas</Link>
        )}
      </div>

      <div className="group/row relative">
        {/* Flecha izquierda */}
        <Arrow dir="prev" visible={canPrev} onClick={() => scroll(-1)} label={`Anteriores en ${title}`} />

        <div
          ref={track}
          className="flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] w-36 shrink-0 animate-pulse rounded-xl bg-telon sm:w-44" />
              ))
            : movies.map((m) => <MovieCard key={m.id} movie={m} className="w-36 shrink-0 snap-start sm:w-44" />)}
        </div>

        {/* Flecha derecha */}
        <Arrow dir="next" visible={canNext} onClick={() => scroll(1)} label={`Siguientes en ${title}`} />
      </div>
    </section>
  );
}

function Arrow({ dir, visible, onClick, label }) {
  const isPrev = dir === 'prev';
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 z-10 flex w-16 items-center transition-opacity duration-300 sm:w-24 ${
        isPrev ? 'left-0 justify-start bg-gradient-to-r' : 'right-0 justify-end bg-gradient-to-l'
      } from-sala via-sala/70 to-transparent ${visible ? 'opacity-100' : 'opacity-0'}`}
      // aspect-[2/3] de las tarjetas: centramos la flecha sobre los carteles, no sobre los títulos
      style={{ bottom: '3.25rem' }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        tabIndex={visible ? 0 : -1}
        className={`grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/70 text-white shadow-xl backdrop-blur transition hover:scale-110 hover:border-butaca-500 hover:bg-butaca-500 focus-visible:outline-2 focus-visible:outline-butaca-500 sm:h-12 sm:w-12 ${
          isPrev ? 'ml-2' : 'mr-2'
        } ${visible ? 'pointer-events-auto' : ''}`}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={isPrev ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
        </svg>
      </button>
    </div>
  );
}
