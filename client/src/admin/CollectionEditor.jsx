import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as admin from '../services/admin';
import { searchMovies } from '../services/movies';
import { getErrorMessage } from '../services/api';
import Spinner from '../components/Spinner';
import { AdminHeader } from './AdminLayout';

const EMPTY = { title: '', emoji: '🎞️', description: '', category: '', tags: [], movies: [], published: false, featured: false };

// Crear / editar una colección: datos, categoría, etiquetas y películas (buscadas en TMDB)
export default function CollectionEditor() {
  const { id } = useParams(); // "nueva" o el id
  const isNew = id === 'nueva';
  const navigate = useNavigate();
  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    admin.getCategories().then(setCategories).catch(() => {});
    admin.getTags().then(setTags).catch(() => {});
    if (!isNew) {
      admin
        .getCollection(id)
        .then((c) =>
          setForm({
            title: c.title, emoji: c.emoji, description: c.description, category: c.category?._id || '',
            tags: c.tags.map((t) => t._id), movies: c.movies, published: c.published, featured: c.featured, slug: c.slug,
          })
        )
        .catch((e) => setError(getErrorMessage(e)));
    }
  }, [id, isNew]);

  if (!form) return error ? <p role="alert" className="alert-error">{error}</p> : <Spinner />;

  const set = (changes) => {
    setForm({ ...form, ...changes });
    setSaved(false);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = { ...form, movies: form.movies.map((m) => ({ tmdbId: m.tmdbId, note: m.note || '' })) };
    try {
      const result = isNew ? await admin.createCollection(body) : await admin.updateCollection(id, body);
      if (isNew) return navigate(`/admin/colecciones/${result._id}`, { replace: true });
      setForm({ ...form, movies: result.movies, slug: result.slug });
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const moveMovie = (i, dir) => {
    const movies = [...form.movies];
    [movies[i], movies[i + dir]] = [movies[i + dir], movies[i]];
    set({ movies });
  };

  return (
    <form onSubmit={save}>
      <Link to="/admin/colecciones" className="text-sm text-zinc-400 hover:text-white">← Colecciones</Link>
      <AdminHeader title={isNew ? 'Nueva colección' : 'Editar colección'} subtitle={form.slug ? `/colecciones/${form.slug}` : 'Se publicará en la parte pública cuando la marques como publicada'}>
        {!isNew && form.published && <Link to={`/colecciones/${form.slug}`} className="btn-ghost">Ver en la web ↗</Link>}
        <button className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : isNew ? 'Crear colección' : 'Guardar cambios'}</button>
      </AdminHeader>
      {error && <p role="alert" className="alert-error mb-4">{error}</p>}
      {saved && <p role="status" className="mb-4 text-sm text-emerald-400">✓ Cambios guardados</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* ---------- Datos ---------- */}
          <section className="rounded-2xl border border-white/10 bg-telon p-5">
            <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
              <div>
                <label htmlFor="eemoji" className="mb-1.5 block text-sm font-medium text-zinc-300">Icono</label>
                <input id="eemoji" className="input text-center text-2xl" maxLength={8} value={form.emoji} onChange={(e) => set({ emoji: e.target.value })} />
              </div>
              <div>
                <label htmlFor="etitle" className="mb-1.5 block text-sm font-medium text-zinc-300">Título</label>
                <input id="etitle" className="input" required maxLength={80} placeholder="Ciclo de terror" value={form.title} onChange={(e) => set({ title: e.target.value })} />
              </div>
            </div>
            <label htmlFor="edesc" className="mb-1.5 mt-4 block text-sm font-medium text-zinc-300">Descripción</label>
            <textarea id="edesc" rows={3} maxLength={600} className="input resize-y" placeholder="¿Por qué estas películas? Cuéntalo como si fuera la contraportada de un DVD."
              value={form.description} onChange={(e) => set({ description: e.target.value })} />
            <p className="text-right text-xs text-zinc-500">{form.description.length}/600</p>
          </section>

          {/* ---------- Películas ---------- */}
          <section className="rounded-2xl border border-white/10 bg-telon p-5">
            <h2 className="font-semibold">Películas ({form.movies.length})</h2>
            <MovieSearch exclude={form.movies.map((m) => m.tmdbId)} onAdd={(m) => set({ movies: [...form.movies, { tmdbId: m.id, title: m.title, poster: m.poster, year: m.year, rating: m.rating, note: '' }] })} />
            {form.movies.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">Busca películas arriba para añadirlas.</p>
            ) : (
              <ol className="mt-4 space-y-2">
                {form.movies.map((m, i) => (
                  <li key={m.tmdbId} className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
                    <span className="w-6 text-center font-display text-xl text-zinc-500">{i + 1}</span>
                    {m.poster ? <img src={m.poster} alt="" className="h-16 w-11 rounded object-cover" /> : <span className="h-16 w-11 rounded bg-sala" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.title} <span className="text-sm font-normal text-zinc-500">{m.year}</span></p>
                      <label htmlFor={`note-${m.tmdbId}`} className="sr-only">Nota del editor sobre {m.title}</label>
                      <input id={`note-${m.tmdbId}`} className="mt-1 w-full rounded-lg border border-white/10 bg-sala px-2 py-1 text-xs" maxLength={200} placeholder="Nota del editor (opcional): por qué está aquí"
                        value={m.note || ''} onChange={(e) => set({ movies: form.movies.map((x) => (x.tmdbId === m.tmdbId ? { ...x, note: e.target.value } : x)) })} />
                    </div>
                    <div className="flex flex-col">
                      <button type="button" disabled={i === 0} onClick={() => moveMovie(i, -1)} className="px-2 text-zinc-400 hover:text-white disabled:opacity-20" aria-label={`Subir ${m.title}`}>▲</button>
                      <button type="button" disabled={i === form.movies.length - 1} onClick={() => moveMovie(i, 1)} className="px-2 text-zinc-400 hover:text-white disabled:opacity-20" aria-label={`Bajar ${m.title}`}>▼</button>
                    </div>
                    <button type="button" onClick={() => set({ movies: form.movies.filter((x) => x.tmdbId !== m.tmdbId) })} className="rounded-lg px-2 py-1 text-xs text-red-300 hover:bg-red-500/10" aria-label={`Quitar ${m.title}`}>✕</button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* ---------- Lateral: publicación, categoría y etiquetas ---------- */}
        <aside className="space-y-6">
          <section className="space-y-3 rounded-2xl border border-white/10 bg-telon p-5">
            <h2 className="font-semibold">Publicación</h2>
            <Toggle checked={form.published} onChange={(v) => set({ published: v })} label="Publicada" hint="Visible en la parte pública" />
            <Toggle checked={form.featured} onChange={(v) => set({ featured: v })} label="Destacada en portada" hint="Aparece en la página de inicio" />
          </section>

          <section className="rounded-2xl border border-white/10 bg-telon p-5">
            <label htmlFor="ecat" className="font-semibold">Categoría</label>
            <select id="ecat" className="input mt-3" value={form.category} onChange={(e) => set({ category: e.target.value })}>
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.emoji} {c.name}</option>)}
            </select>
            <Link to="/admin/categorias" className="mt-2 inline-block text-xs text-butaca-500 hover:underline">Gestionar categorías</Link>
          </section>

          <section className="rounded-2xl border border-white/10 bg-telon p-5">
            <h2 className="font-semibold">Etiquetas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((t) => {
                const on = form.tags.includes(t._id);
                return (
                  <button type="button" key={t._id} aria-pressed={on} onClick={() => set({ tags: on ? form.tags.filter((x) => x !== t._id) : [...form.tags, t._id] })}
                    className={`rounded-full border px-3 py-1 text-sm transition ${on ? 'border-butaca-500 bg-butaca-500 text-white' : 'border-white/10 text-zinc-300 hover:border-white/30'}`}>
                    #{t.name}
                  </button>
                );
              })}
              {tags.length === 0 && <p className="text-sm text-zinc-500">No hay etiquetas.</p>}
            </div>
            <Link to="/admin/categorias" className="mt-3 inline-block text-xs text-butaca-500 hover:underline">Gestionar etiquetas</Link>
          </section>
        </aside>
      </div>
    </form>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-zinc-600 transition peer-checked:bg-butaca-500 peer-focus-visible:ring-2 peer-focus-visible:ring-butaca-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-zinc-500">{hint}</span>
      </span>
    </label>
  );
}

// Buscador de TMDB para añadir películas a la colección
function MovieSearch({ exclude, onAdd }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (q.trim().length < 2) return setResults([]);
    const t = setTimeout(() => searchMovies(q.trim()).then((d) => setResults(d.results.slice(0, 8))).catch(() => {}), 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative mt-3">
      <label htmlFor="msq" className="sr-only">Buscar película para añadir</label>
      <input id="msq" className="input" placeholder="🔍 Buscar película en TMDB para añadirla…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-white/10 bg-sala shadow-2xl">
          {results.map((m) => {
            const added = exclude.includes(m.id);
            return (
              <li key={m.id}>
                <button type="button" disabled={added} onClick={() => { onAdd(m); setQ(''); setResults([]); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5 disabled:opacity-50">
                  {m.poster ? <img src={m.poster} alt="" className="h-12 w-8 rounded object-cover" /> : <span className="h-12 w-8 rounded bg-telon" />}
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{m.title}</span>
                    <span className="block text-xs text-zinc-500">{m.year || 'Sin fecha'}</span>
                  </span>
                  <span className="text-xs text-zinc-400">{added ? '✓ Añadida' : '＋ Añadir'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
