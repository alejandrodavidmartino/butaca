import { useEffect, useState } from 'react';
import * as admin from '../services/admin';
import { getErrorMessage } from '../services/api';
import { AdminHeader } from './AdminLayout';

// Categorías y etiquetas de las colecciones (CRUD)
export default function AdminTaxonomy() {
  return (
    <>
      <AdminHeader title="Categorías y etiquetas" subtitle="Organizan las colecciones de la parte pública" />
      <div className="grid gap-6 xl:grid-cols-2">
        <CategoriesPanel />
        <TagsPanel />
      </div>
    </>
  );
}

function CategoriesPanel() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '🎬', description: '' });
  const [editing, setEditing] = useState(null); // id en edición
  const [error, setError] = useState('');

  const load = () => admin.getCategories().then(setItems).catch((e) => setError(getErrorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const run = async (fn) => {
    setError('');
    try {
      await fn();
      await load();
      return true;
    } catch (e) {
      setError(getErrorMessage(e));
      return false;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const ok = await run(() => (editing ? admin.updateCategory(editing, form) : admin.createCategory(form)));
    if (ok) {
      setForm({ name: '', emoji: '🎬', description: '' });
      setEditing(null);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-telon p-5">
      <h2 className="font-semibold">Categorías</h2>
      <p className="text-sm text-zinc-400">Cada colección pertenece a una categoría.</p>

      <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[70px_1fr]">
        <label htmlFor="cemoji" className="sr-only">Emoji</label>
        <input id="cemoji" className="input text-center text-xl" maxLength={8} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <label htmlFor="cname" className="sr-only">Nombre de la categoría</label>
        <input id="cname" className="input" maxLength={40} required placeholder="Nombre (p. ej. Ciclos temáticos)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label htmlFor="cdesc" className="sr-only">Descripción</label>
        <input id="cdesc" className="input sm:col-span-2" maxLength={200} placeholder="Descripción (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex gap-2 sm:col-span-2">
          <button className="btn-primary">{editing ? 'Guardar cambios' : '＋ Añadir categoría'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', emoji: '🎬', description: '' }); }} className="btn-ghost">Cancelar</button>}
        </div>
      </form>
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}

      <ul className="mt-5 divide-y divide-white/5">
        {items?.map((c) => (
          <li key={c._id} className="flex items-center gap-3 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 text-xl">{c.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{c.name}</span>
              <span className="block truncate text-xs text-zinc-500">{c.description || `/${c.slug}`} · {c.collections} {c.collections === 1 ? 'colección' : 'colecciones'}</span>
            </span>
            <button onClick={() => { setEditing(c._id); setForm({ name: c.name, emoji: c.emoji, description: c.description || '' }); }} className="rounded-lg px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">Editar</button>
            <button
              onClick={() => confirm(`¿Borrar la categoría «${c.name}»?${c.collections ? ` Sus ${c.collections} colecciones se quedarán sin categoría.` : ''}`) && run(() => admin.deleteCategory(c._id))}
              className="rounded-lg px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
            >
              Borrar
            </button>
          </li>
        ))}
        {items?.length === 0 && <li className="py-6 text-center text-sm text-zinc-500">Aún no hay categorías.</li>}
      </ul>
    </section>
  );
}

function TagsPanel() {
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [error, setError] = useState('');

  const load = () => admin.getTags().then(setItems).catch((e) => setError(getErrorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const run = async (fn) => {
    setError('');
    try {
      await fn();
      await load();
      return true;
    } catch (e) {
      setError(getErrorMessage(e));
      return false;
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (await run(() => admin.createTag({ name }))) setName('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (await run(() => admin.updateTag(editing.id, { name: editing.name }))) setEditing(null);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-telon p-5">
      <h2 className="font-semibold">Etiquetas</h2>
      <p className="text-sm text-zinc-400">Una colección puede tener varias. Sirven para filtrar.</p>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <label htmlFor="tname" className="sr-only">Nueva etiqueta</label>
        <input id="tname" className="input" maxLength={30} required placeholder="Nueva etiqueta (p. ej. Años 80)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary shrink-0">＋ Añadir</button>
      </form>
      {error && <p role="alert" className="alert-error mt-3">{error}</p>}

      <ul className="mt-5 flex flex-wrap gap-2">
        {items?.map((t) =>
          editing?.id === t._id ? (
            <li key={t._id}>
              <form onSubmit={saveEdit} className="flex gap-1">
                <label htmlFor={`tedit-${t._id}`} className="sr-only">Editar etiqueta</label>
                <input id={`tedit-${t._id}`} autoFocus className="input w-40 py-1 text-sm" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <button className="rounded-lg bg-butaca-500 px-2 text-xs">OK</button>
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-2 text-xs text-zinc-400">✕</button>
              </form>
            </li>
          ) : (
            <li key={t._id} className="group flex items-center gap-1 rounded-full border border-white/10 py-1 pl-3 pr-1 text-sm">
              <button onClick={() => setEditing({ id: t._id, name: t.name })} className="hover:text-butaca-500" title="Editar">#{t.name}</button>
              <span className="text-xs text-zinc-500">{t.collections}</span>
              <button
                onClick={() => confirm(`¿Borrar la etiqueta «${t.name}»? Se quitará de todas las colecciones.`) && run(() => admin.deleteTag(t._id))}
                className="grid h-6 w-6 place-items-center rounded-full text-zinc-500 hover:bg-red-500/15 hover:text-red-300"
                aria-label={`Borrar etiqueta ${t.name}`}
              >
                ✕
              </button>
            </li>
          )
        )}
        {items?.length === 0 && <li className="w-full py-6 text-center text-sm text-zinc-500">Aún no hay etiquetas.</li>}
      </ul>
    </section>
  );
}
