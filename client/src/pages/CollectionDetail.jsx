import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { getPublicCollection } from '../services/admin';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import Rating from '../components/Rating';
import AddToGroup from '../components/AddToGroup';

// /colecciones/:slug — página pública de una colección
export default function CollectionDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: c, loading, error } = useFetch(() => getPublicCollection(slug), [slug]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  const hero = c.movies.find((m) => m.backdrop)?.backdrop;

  return (
    <article>
      <header className="relative isolate overflow-hidden">
        {hero && <img src={hero} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-sala via-sala/80 to-sala/40" />
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-16">
          <Link to="/colecciones" className="text-sm text-zinc-300 hover:text-white">← Colecciones</Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-butaca-500">
            {c.category ? `${c.category.emoji} ${c.category.name}` : 'Colección'} · {c.movies.length} películas
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none tracking-wide sm:text-7xl">{c.emoji} {c.title}</h1>
          {c.description && <p className="mt-4 max-w-2xl text-lg text-zinc-200">{c.description}</p>}
          {c.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <Link key={t._id} to={`/colecciones?etiqueta=${t.slug}`} className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-200 hover:border-butaca-500">#{t.name}</Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <ol className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        {c.movies.map((m, i) => (
          <li key={m.tmdbId} className="flex gap-4 rounded-2xl border border-white/10 bg-telon p-3 sm:gap-6 sm:p-4">
            <span className="hidden w-10 shrink-0 pt-1 text-center font-display text-4xl text-zinc-600 sm:block">{i + 1}</span>
            <Link to={`/pelicula/${m.tmdbId}`} className="shrink-0">
              {m.poster ? <img src={m.poster} alt={`Cartel de ${m.title}`} loading="lazy" className="h-36 w-24 rounded-xl object-cover" /> : <span className="block h-36 w-24 rounded-xl bg-sala" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link to={`/pelicula/${m.tmdbId}`} className="text-lg font-semibold hover:text-butaca-500">{m.title}</Link>
              <p className="flex items-center gap-3 text-sm text-zinc-400">{m.year} <Rating value={m.rating} /></p>
              {m.note && <p className="mt-2 text-sm italic text-zinc-300">✍️ {m.note}</p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-3">
                <Link to={`/pelicula/${m.tmdbId}`} className="btn-ghost px-3 py-1.5 text-xs">Ver ficha</Link>
                {user && <AddToGroup tmdbId={m.tmdbId} compact />}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
