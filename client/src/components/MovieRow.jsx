import { Link } from 'react-router-dom';
import FocusCarousel from './FocusCarousel';

// Fila de películas con carrusel "con foco"
export default function MovieRow({ title, movies = [], link, loading }) {
  return (
    <section className="mx-auto max-w-7xl py-6" aria-label={title}>
      <div className="mb-1 flex items-end justify-between px-4">
        <h2 className="font-display text-3xl tracking-wide">{title}</h2>
        {link && (
          <Link to={link} className="text-sm font-medium text-butaca-500 hover:underline">Ver todas</Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 overflow-hidden py-4">
          {[0.46, 0.73, 1, 0.73, 0.46].map((o, i) => (
            <div
              key={i}
              className="aspect-[2/3] w-[150px] shrink-0 animate-pulse rounded-xl bg-telon sm:w-[196px]"
              style={{ opacity: o === 1 ? 1 : o > 0.5 ? 0.9 : 0.8, transform: `scale(${o === 1 ? 1 : o > 0.5 ? 0.92 : 0.84})` }}
            />
          ))}
        </div>
      ) : (
        <FocusCarousel movies={movies} label={title} />
      )}
    </section>
  );
}
