import { Link } from 'react-router-dom';

// Tarjeta de una colección: abanico de carteles + título + categoría
export default function CollectionCard({ collection: c }) {
  return (
    <Link to={`/colecciones/${c.slug}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-telon transition hover:-translate-y-1 hover:border-butaca-500/60">
      <div className="relative flex h-44 items-end justify-center overflow-hidden bg-gradient-to-b from-butaca-700/30 to-telon pt-6">
        {c.movies.slice(0, 5).map((m, i, arr) => {
          const mid = (arr.length - 1) / 2;
          return (
            <img
              key={m.tmdbId}
              src={m.poster}
              alt=""
              loading="lazy"
              className="-mx-4 h-36 w-24 rounded-lg object-cover shadow-xl ring-2 ring-telon transition duration-300 group-hover:-translate-y-1"
              style={{ transform: `rotate(${(i - mid) * 6}deg) translateY(${Math.abs(i - mid) * 8}px)`, zIndex: 10 - Math.abs(i - mid) }}
            />
          );
        })}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-butaca-500">
          {c.category ? `${c.category.emoji} ${c.category.name}` : 'Colección'}
        </p>
        <h3 className="mt-1 text-lg font-semibold group-hover:text-white">{c.emoji} {c.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{c.description}</p>
        <p className="mt-3 text-xs text-zinc-500">{c.moviesCount ?? c.movies.length} películas</p>
      </div>
    </Link>
  );
}
