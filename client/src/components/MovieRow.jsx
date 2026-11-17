import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';

// Fila horizontal deslizable de películas (estilo plataforma de streaming)
export default function MovieRow({ title, movies = [], link, loading }) {
  return (
    <section className="mx-auto max-w-7xl py-6">
      <div className="mb-3 flex items-end justify-between px-4">
        <h2 className="font-display text-3xl tracking-wide">{title}</h2>
        {link && (
          <Link to={link} className="text-sm font-medium text-butaca-500 hover:underline">Ver todas</Link>
        )}
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] w-36 shrink-0 animate-pulse rounded-xl bg-telon sm:w-44" />
            ))
          : movies.map((m) => <MovieCard key={m.id} movie={m} className="w-36 shrink-0 snap-start sm:w-44" />)}
      </div>
    </section>
  );
}
