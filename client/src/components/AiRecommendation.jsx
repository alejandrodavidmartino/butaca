import { Link } from 'react-router-dom';
import Rating from './Rating';

// Tarjeta de una película recomendada por la IA, con el "por qué"
export default function AiRecommendation({ movie, action }) {
  return (
    <article className="flex gap-4 rounded-xl border border-white/10 bg-telon p-3">
      <Link to={`/pelicula/${movie.id}`} className="shrink-0">
        {movie.poster ? (
          <img src={movie.poster} alt={`Cartel de ${movie.title}`} loading="lazy" className="h-36 w-24 rounded-lg object-cover" />
        ) : (
          <div className="grid h-36 w-24 place-items-center rounded-lg bg-sala text-2xl">🎬</div>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link to={`/pelicula/${movie.id}`} className="font-semibold leading-tight hover:text-butaca-500">
          {movie.title}
        </Link>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
          {movie.year} <Rating value={movie.rating} />
        </p>
        <p className="mt-2 text-sm leading-snug text-zinc-300">
          <span aria-hidden="true">🐀 </span>
          {movie.reason}
        </p>
        {action && <div className="mt-auto pt-3">{action}</div>}
      </div>
    </article>
  );
}
