import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as admin from '../services/admin';
import { getErrorMessage } from '../services/api';
import Avatar from '../components/Avatar';
import GroupAvatar from '../components/GroupAvatar';
import ScoreBadge from '../components/ScoreBadge';
import { AdminHeader } from './AdminLayout';

const formatDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

// Moderación: comentarios de las notas en grupos y los propios grupos
export default function AdminModeration() {
  const [tab, setTab] = useState('comments');
  return (
    <>
      <AdminHeader title="Moderación" subtitle="Revisa lo que publican los usuarios" />
      <div role="tablist" className="mb-6 flex gap-2 border-b border-white/10">
        {[['comments', 'Comentarios'], ['groups', 'Grupos']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === k ? 'border-butaca-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'comments' ? <Comments /> : <Groups />}
    </>
  );
}

function Comments() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const load = () => admin.getComments().then(setItems).catch((e) => setError(getErrorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const remove = async (c) => {
    if (!confirm('¿Borrar este comentario? La nota se mantiene.')) return;
    try {
      await admin.deleteComment(c.groupId, c.ratingId);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (error) return <p role="alert" className="alert-error">{error}</p>;
  if (!items) return <div className="h-40 animate-pulse rounded-2xl bg-telon" />;
  if (!items.length) return <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-zinc-400">No hay comentarios en los grupos.</p>;

  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <li key={c.ratingId} className="flex gap-4 rounded-2xl border border-white/10 bg-telon p-4">
          <Avatar user={c.author} />
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              {c.author ? <Link to={`/u/${c.author.username}`} className="font-medium hover:text-butaca-500">{c.author.name}</Link> : 'Usuario eliminado'}{' '}
              <span className="text-zinc-500">sobre</span> <Link to={`/pelicula/${c.tmdbId}`} className="hover:text-butaca-500">{c.movieTitle}</Link>{' '}
              <span className="text-zinc-500">en «{c.groupName}» · {formatDate(c.date)}</span>
            </p>
            <p className="mt-1 text-zinc-200">«{c.comment}»</p>
          </div>
          <ScoreBadge score={c.score} />
          <button onClick={() => remove(c)} className="self-start rounded-lg px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">Borrar</button>
        </li>
      ))}
    </ul>
  );
}

function Groups() {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const load = () => admin.getAdminGroups({ q: q.trim() || undefined }).then(setItems).catch((e) => setError(getErrorMessage(e)));
  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const remove = async (g) => {
    if (!confirm(`¿Borrar el grupo «${g.name}» con sus ${g.members} miembros y ${g.movies} películas? No se puede deshacer.`)) return;
    try {
      await admin.deleteAdminGroup(g._id);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <>
      <label htmlFor="gq" className="sr-only">Buscar grupos</label>
      <input id="gq" type="search" className="input mb-4 max-w-xs" placeholder="Buscar grupos…" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p role="alert" className="alert-error mb-4">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-telon">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Grupo</th>
              <th className="px-4 py-3 font-medium">Creador</th>
              <th className="px-4 py-3 text-right font-medium">Miembros</th>
              <th className="px-4 py-3 text-right font-medium">Películas</th>
              <th className="px-4 py-3 text-right font-medium">Comentarios</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {items?.map((g) => (
              <tr key={g._id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <GroupAvatar group={g} className="h-9 w-9 rounded-lg text-lg" />
                    <span>
                      <span className="block font-medium">{g.name}</span>
                      {g.description && <span className="block max-w-56 truncate text-xs text-zinc-500">{g.description}</span>}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">{g.owner ? <Link to={`/u/${g.owner.username}`} className="hover:text-butaca-500">@{g.owner.username}</Link> : '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums">{g.members}</td>
                <td className="px-4 py-3 text-right tabular-nums">{g.movies}</td>
                <td className="px-4 py-3 text-right tabular-nums">{g.comments}</td>
                <td className="px-4 py-3 text-zinc-400">{formatDate(g.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(g)} className="rounded-lg px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">Borrar</button>
                </td>
              </tr>
            ))}
            {items?.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-400">No hay grupos.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
