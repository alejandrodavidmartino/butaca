import { useSearchParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { getCollectionCategories, getPublicCollections } from '../services/admin';
import CollectionCard from '../components/CollectionCard';
import ErrorMessage from '../components/ErrorMessage';

// /colecciones: todas las colecciones publicadas, filtrables por categoría o etiqueta
export default function Collections() {
  const [params, setParams] = useSearchParams();
  const category = params.get('categoria') || '';
  const tag = params.get('etiqueta') || '';
  const { data: categories } = useFetch(getCollectionCategories);
  const { data, loading, error } = useFetch(
    () => getPublicCollections({ category: category || undefined, tag: tag || undefined }),
    [category, tag]
  );

  const chip = (active) =>
    `rounded-full border px-3 py-1 text-sm transition ${active ? 'border-butaca-500 bg-butaca-500 text-white' : 'border-white/10 text-zinc-300 hover:border-white/30'}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-butaca-500">Seleccionadas por el equipo de Butaca</p>
      <h1 className="font-display text-5xl tracking-wide">Colecciones</h1>
      <p className="max-w-2xl text-zinc-400">Ciclos temáticos, maratones y joyas escondidas para cuando no sabes por dónde empezar.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setParams({})} className={chip(!category && !tag)}>Todas</button>
        {categories?.map((c) => (
          <button key={c._id} onClick={() => setParams({ categoria: c.slug })} className={chip(category === c.slug)}>{c.emoji} {c.name}</button>
        ))}
        {tag && <span className={chip(true)}>#{tag} <button onClick={() => setParams({})} aria-label="Quitar filtro de etiqueta">✕</button></span>}
      </div>

      {error ? (
        <ErrorMessage message={error} />
      ) : loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-telon" />)}
        </div>
      ) : data.length === 0 ? (
        <p className="py-16 text-center text-zinc-400">No hay colecciones con ese filtro todavía.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => <CollectionCard key={c._id} collection={c} />)}
        </div>
      )}
    </section>
  );
}
