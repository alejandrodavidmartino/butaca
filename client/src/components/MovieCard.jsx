import { Link } from 'react-router-dom';
import Rating from './Rating';

// Tarjeta de película con cartel, título, año y nota
export default function MovieCard({ movie, className = '' }) {
  return (
    <Link to={`/pelicula/${movie.id}`} className={`group block ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-telon ring-1 ring-white/5 transition group-hover:ring-butaca-500/60">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={`Cartel de ${movie.title}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center p-4 text-center text-sm text-zinc-500">
            {movie.title}
          </div>
        )}
        {movie.rating && (
          <span className="absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs backdrop-blur">
            <Rating value={movie.rating} />
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-1 text-sm font-medium text-zinc-200 group-hover:text-white">{movie.title}</h3>
      <p className="text-xs text-zinc-500">{movie.year || 'Sin fecha'}</p>
    </Link>
  );
}
