import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { createGroup, getMyGroups, joinGroup } from '../services/groups';
import { getErrorMessage } from '../services/api';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import ErrorMessage from '../components/ErrorMessage';

const EMOJIS = ['🍿', '🎬', '🍕', '👻', '💘', '🚀', '🏠', '🎉'];

// "Mi Butaca": perfil + mis grupos + crear grupo + unirse con código
export default function MyGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: groups, loading, error } = useFetch(getMyGroups);
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    try {
      const group = await joinGroup(code);
      navigate(`/grupos/${group._id}`);
    } catch (err) {
      setJoinError(getErrorMessage(err));
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* ---------- Perfil ---------- */}
      <div className="flex flex-wrap items-center gap-4">
        <Avatar user={user} size="h-16 w-16 text-2xl" />
        <div>
          <h1 className="font-display text-5xl leading-none tracking-wide">Mi Butaca</h1>
          <p className="text-zinc-400">
            {user.name} · <span className="text-butaca-500">@{user.username}</span>
          </p>
        </div>
      </div>

      {/* ---------- Acciones ---------- */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-telon p-6">
          <h2 className="font-semibold">Crea un grupo</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Para tus amigos, tu pareja o tu familia. Cada uno añade películas y, cuando no os decidáis, ¡ruleta!
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">＋ Nuevo grupo</button>
        </div>

        <form onSubmit={handleJoin} className="rounded-2xl border border-white/10 bg-telon p-6">
          <h2 className="font-semibold">¿Te han pasado un código?</h2>
          <p className="mt-1 text-sm text-zinc-400">Escríbelo para unirte al grupo de tus amigos.</p>
          <div className="mt-4 flex gap-2">
            <label htmlFor="code" className="sr-only">Código de invitación</label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: K7QM2X"
              maxLength={6}
              className="input flex-1 font-mono uppercase tracking-[0.3em]"
            />
            <button className="btn-ghost" disabled={code.length < 6}>Unirme</button>
          </div>
          {joinError && <p role="alert" className="alert-error mt-3">{joinError}</p>}
        </form>
      </div>

      {/* ---------- Mis grupos ---------- */}
      <h2 className="mt-12 font-display text-3xl tracking-wide">Mis grupos</h2>
      {error && <ErrorMessage message={error} />}
      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-telon" />)}
        </div>
      ) : groups?.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-white/15 p-10 text-center text-zinc-400">
          Todavía no estás en ningún grupo. ¡Crea el primero y comparte el código con tus amigos!
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups?.map((g) => <GroupCard key={g._id} group={g} />)}
        </div>
      )}

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => navigate(`/grupos/${g._id}`)}
        />
      )}
    </section>
  );
}

function GroupCard({ group }) {
  return (
    <Link
      to={`/grupos/${group._id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-telon p-5 transition hover:border-butaca-500/60"
    >
      {/* Collage de carteles al fondo */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-1/2 opacity-25 [mask-image:linear-gradient(to_left,black,transparent)]">
        {group.posters.map((p) => <img key={p} src={p} alt="" className="h-full w-1/4 object-cover" />)}
      </div>
      <div className="relative">
        <span className="text-4xl">{group.emoji}</span>
        <h3 className="mt-2 text-lg font-semibold group-hover:text-white">{group.name}</h3>
        <p className="line-clamp-1 text-sm text-zinc-400">{group.description || ' '}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {group.members.slice(0, 5).map((m) => <Avatar key={m._id} user={m} size="h-8 w-8 text-xs" />)}
            {group.members.length > 5 && (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-700 text-xs ring-2 ring-sala">
                +{group.members.length - 5}
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-400">
            {group.pendingCount} pendientes · {group.moviesCount} en total
          </span>
        </div>
      </div>
    </Link>
  );
}

function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', emoji: '🍿' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      onCreated(await createGroup(form));
    } catch (err) {
      setError(getErrorMessage(err));
      setSending(false);
    }
  };

  return (
    <Modal title="Nuevo grupo" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">Icono</span>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setForm({ ...form, emoji: e })}
                aria-pressed={form.emoji === e}
                className={`grid h-11 w-11 place-items-center rounded-lg text-2xl transition ${
                  form.emoji === e ? 'bg-butaca-500/30 ring-2 ring-butaca-500' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="gname" className="mb-1.5 block text-sm font-medium text-zinc-300">Nombre</label>
          <input id="gname" className="input" maxLength={40} required autoFocus placeholder="Pelis de los viernes"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="gdesc" className="mb-1.5 block text-sm font-medium text-zinc-300">Descripción (opcional)</label>
          <input id="gdesc" className="input" maxLength={160} placeholder="Los de la uni, sin spoilers"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {error && <p role="alert" className="alert-error">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={sending || !form.name.trim()}>
          {sending ? 'Creando…' : 'Crear grupo'}
        </button>
      </form>
    </Modal>
  );
}
