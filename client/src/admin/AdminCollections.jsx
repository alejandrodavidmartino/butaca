import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as admin from '../services/admin';
import { getErrorMessage } from '../services/api';
import { AdminHeader } from './AdminLayout';

// Listado de colecciones (el contenido del sitio) con filtros
export default function AdminCollections() {
  const [items, setItems] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', status: '' });
  const [error, setError] = useState('');

  const load = () =>
    admin
      .getCollections({ q: filters.q.trim() || undefined, category: filters.category || undefined, status: filters.status || undefined })
      .then(setItems)
      .catch((e) => setError(getErrorMessage(e)));

  useEffect(() => {
    admin.getCategories().then(setCategories).catch(() => {});
  }, []);
  useEffect(() => {
    const t = setTimeout(load, filters.q ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const toggle = async (c, field) => {
    try {
      await admin.updateCollection(c._id, { [field]: !c[field] });
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const remove = async (c) => {
    if (!confirm(`¿Borrar la colección «${c.title}»?`)) return;
    try {
      await admin.deleteCollection(c._id);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <>
      <AdminHeader title="Colecciones" subtitle="Listas de películas que se publican en la portada y en /colecciones">
        <Link to="/admin/colecciones/nueva" className="btn-primary">＋ Nueva colección</Link>
      </AdminHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="cq" className="sr-only">Buscar colecciones</label>
        <input id="cq" type="search" className="input max-w-xs" placeholder="Buscar por título…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <label htmlFor="ccat" className="sr-only">Categoría</label>
        <select id="ccat" className="input w-auto" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.emoji} {c.name}</option>)}
        </select>
        <label htmlFor="cstatus" className="sr-only">Estado</label>
        <select id="cstatus" className="input w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Publicadas y borradores</option>
          <option value="published">Publicadas</option>
          <option value="draft">Borradores</option>
        </select>
      </div>
      {error && <p role="alert" className="alert-error mb-4">{error}</p>}

      {!items ? (
        <div className="h-40 animate-pulse rounded-2xl bg-telon" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-zinc-400">
          <p>No hay colecciones con esos filtros.</p>
          <Link to="/admin/colecciones/nueva" className="btn-primary mt-4">＋ Crear la primera</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c._id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-telon p-4 sm:flex-row sm:items-center">
              {/* Mini collage de carteles */}
              <div className="flex shrink-0 -space-x-6">
                {c.movies.slice(0, 4).map((m) => (
                  <img key={m.tmdbId} src={m.poster} alt="" className="h-20 w-14 rounded-md object-cover ring-2 ring-telon" />
                ))}
                {c.movies.length === 0 && <span className="grid h-20 w-14 place-items-center rounded-md bg-white/5 text-2xl">{c.emoji}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{c.emoji} {c.title}</span>
                  {c.published ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">Publicada</span>
                  ) : (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">Borrador</span>
                  )}
                  {c.featured && <span className="rounded-full bg-butaca-500/15 px-2 py-0.5 text-xs text-red-200">★ En portada</span>}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {c.category ? `${c.category.emoji} ${c.category.name}` : 'Sin categoría'} · {c.movies.length} películas
                  {c.tags.length > 0 && ` · ${c.tags.map((t) => '#' + t.name).join(' ')}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => toggle(c, 'published')} className="rounded-lg px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">
                  {c.published ? 'Despublicar' : 'Publicar'}
                </button>
                <button onClick={() => toggle(c, 'featured')} className="rounded-lg px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">
                  {c.featured ? 'Quitar de portada' : '★ Portada'}
                </button>
                {c.published && <Link to={`/colecciones/${c.slug}`} className="rounded-lg px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">Ver ↗</Link>}
                <Link to={`/admin/colecciones/${c._id}`} className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20">Editar</Link>
                <button onClick={() => remove(c)} className="rounded-lg px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">Borrar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
