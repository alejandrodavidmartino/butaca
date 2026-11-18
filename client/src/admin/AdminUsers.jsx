import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteUser, getUsers, updateUser } from '../services/admin';
import { getErrorMessage } from '../services/api';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';
import { AdminHeader } from './AdminLayout';

const formatDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

// Gestión de usuarios: buscar, filtrar, cambiar rol, bloquear/desbloquear y borrar
export default function AdminUsers() {
  const { user: me } = useAuth();
  const [filters, setFilters] = useState({ q: '', role: '', status: '', page: 1 });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = () =>
    getUsers({ ...filters, q: filters.q.trim() || undefined, role: filters.role || undefined, status: filters.status || undefined })
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)));

  useEffect(() => {
    const t = setTimeout(load, filters.q ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const act = async (u, fn, confirmText) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(u._id);
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const set = (changes) => setFilters({ ...filters, page: 1, ...changes });

  return (
    <>
      <AdminHeader title="Usuarios" subtitle={data ? `${data.total} ${data.total === 1 ? 'usuario' : 'usuarios'}` : ' '} />

      <div className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="uq" className="sr-only">Buscar usuarios</label>
        <input id="uq" type="search" className="input max-w-xs" placeholder="Buscar por nombre, @usuario o email" value={filters.q} onChange={(e) => set({ q: e.target.value })} />
        <label htmlFor="urole" className="sr-only">Rol</label>
        <select id="urole" className="input w-auto" value={filters.role} onChange={(e) => set({ role: e.target.value })}>
          <option value="">Todos los roles</option>
          <option value="user">Usuarios</option>
          <option value="admin">Administradores</option>
        </select>
        <label htmlFor="ustatus" className="sr-only">Estado</label>
        <select id="ustatus" className="input w-auto" value={filters.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="blocked">Bloqueados</option>
        </select>
      </div>

      {error && <p role="alert" className="alert-error mb-4">{error}</p>}

      {/* En móvil, tarjetas (una tabla de 8 columnas no cabe) */}
      <ul className="space-y-3 md:hidden">
        {!data && [1, 2, 3].map((i) => <li key={i} className="h-36 animate-pulse rounded-2xl bg-telon" />)}
        {data?.items.map((u) => {
          const isMe = u._id === me._id;
          return (
            <li key={u._id} className={`rounded-2xl border border-white/10 bg-telon p-4 ${busy === u._id ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-3">
                <Link to={`/u/${u.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar user={u} size="h-10 w-10 text-sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{u.name} {isMe && <span className="text-zinc-500">(tú)</span>}</span>
                    <span className="block truncate text-xs text-zinc-500">@{u.username} · {u.email}</span>
                  </span>
                </Link>
                <StatusPill active={u.active} />
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                Alta {formatDate(u.createdAt)} · {u.watchedCount} vistas · {u.groupCount} grupos
              </p>
              <EmailStatus u={u} act={act} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RoleSelect u={u} isMe={isMe} busy={busy} act={act} />
                {!isMe && <UserActions u={u} act={act} />}
              </div>
            </li>
          );
        })}
        {data?.items.length === 0 && <li className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-zinc-400">No hay usuarios con esos filtros.</li>}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-telon md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Alta</th>
              <th className="px-4 py-3 text-right font-medium">Vistas</th>
              <th className="px-4 py-3 text-right font-medium">Grupos</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {!data
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5"><td colSpan={8} className="px-4 py-4"><div className="h-5 animate-pulse rounded bg-white/5" /></td></tr>
                ))
              : data.items.map((u) => {
                  const isMe = u._id === me._id;
                  return (
                    <tr key={u._id} className={`border-b border-white/5 last:border-0 ${busy === u._id ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <Link to={`/u/${u.username}`} className="flex items-center gap-3 hover:text-butaca-500">
                          <Avatar user={u} size="h-8 w-8 text-xs" />
                          <span>
                            <span className="block font-medium">{u.name} {isMe && <span className="text-zinc-500">(tú)</span>}</span>
                            <span className="block text-xs text-zinc-500">@{u.username}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        <span className="block">{u.email}</span>
                        <EmailStatus u={u} act={act} />
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{u.watchedCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{u.groupCount}</td>
                      <td className="px-4 py-3">
                        <RoleSelect u={u} isMe={isMe} busy={busy} act={act} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill active={u.active} />
                      </td>
                      <td className="px-4 py-3">
                        {!isMe && (
                          <div className="flex justify-end gap-1"><UserActions u={u} act={act} /></div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            {data?.items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-400">No hay usuarios con esos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.page} totalPages={data.pages} onChange={(page) => setFilters({ ...filters, page })} />}
    </>
  );
}

function EmailStatus({ u, act }) {
  return u.emailVerified ? (
    <span className="text-xs text-emerald-400">✓ Correo confirmado</span>
  ) : (
    <span className="text-xs text-amber-300">
      ✉️ Sin confirmar ·{' '}
      <button onClick={() => act(u, () => updateUser(u._id, { emailVerified: true }), `¿Marcar el correo de @${u.username} como confirmado?`)} className="underline hover:text-white">
        verificar a mano
      </button>
    </span>
  );
}

function RoleSelect({ u, isMe, busy, act }) {
  return (
    <>
      <label className="sr-only" htmlFor={`role-${u._id}`}>Rol de {u.name}</label>
      <select
        id={`role-${u._id}`}
        value={u.role}
        disabled={isMe || busy === u._id}
        onChange={(e) => act(u, () => updateUser(u._id, { role: e.target.value }), `¿Cambiar el rol de @${u.username} a ${e.target.value === 'admin' ? 'administrador' : 'usuario'}?`)}
        className="rounded-lg border border-white/10 bg-sala px-2 py-1.5 text-xs disabled:opacity-60"
      >
        <option value="user">Usuario</option>
        <option value="admin">Admin</option>
      </select>
    </>
  );
}

const StatusPill = ({ active }) =>
  active ? (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">● Activo</span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">⛔ Bloqueado</span>
  );

function UserActions({ u, act }) {
  return (
    <>
      <button
        onClick={() => act(u, () => updateUser(u._id, { active: !u.active }), u.active ? `¿Bloquear a @${u.username}? No podrá entrar en Butaca.` : null)}
        className="rounded-lg px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
      >
        {u.active ? 'Bloquear' : 'Desbloquear'}
      </button>
      <button
        onClick={() => act(u, () => deleteUser(u._id), `¿Borrar a @${u.username} y todos sus datos? No se puede deshacer.`)}
        className="rounded-lg px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
      >
        Borrar
      </button>
    </>
  );
}
