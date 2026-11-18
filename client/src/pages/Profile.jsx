import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';
import Avatar from '../components/Avatar';
import ScoreBadge from '../components/ScoreBadge';
import GroupAvatar from '../components/GroupAvatar';
import Ratatus from '../components/Ratatus';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

const memberSince = (d) => new Date(d).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

// Perfil de un usuario (/u/:username). Si es el mío, puedo editarlo y pedir a Ratatús mi perfil cinéfilo.
export default function Profile() {
  const { username } = useParams();
  const { user: me, generateTaste, isVerified } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tasteState, setTasteState] = useState({ loading: false, error: '' });

  useEffect(() => {
    setData(null);
    setError('');
    api.get(`/users/${username}/profile`).then((r) => setData(r.data)).catch((err) => setError(getErrorMessage(err)));
    // Si cambio mi propio perfil (foto, bio, Ratatús...), recargamos
  }, [username, me?.avatarVersion, me?.bio, me?.tasteSummary, me?.name]);

  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Spinner />;

  const { user, stats, isMe, commonGroups } = data;
  let taste = null;
  try {
    taste = user.tasteSummary ? JSON.parse(user.tasteSummary) : null;
  } catch {
    taste = null;
  }

  const askRatatus = async () => {
    setTasteState({ loading: true, error: '' });
    try {
      await generateTaste();
      setTasteState({ loading: false, error: '' });
    } catch (err) {
      setTasteState({ loading: false, error: getErrorMessage(err) });
    }
  };

  // ---------- Perfil privado ----------
  if (data.private) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <Avatar user={user} size="h-24 w-24 text-3xl" className="mx-auto" />
        <h1 className="mt-4 font-display text-4xl tracking-wide">{user.name}</h1>
        <p className="text-zinc-400">@{user.username}</p>
        <p className="mt-6 rounded-xl bg-white/5 p-4 text-zinc-300">🔒 Este perfil es privado.</p>
      </section>
    );
  }

  const maxGenre = stats.genres[0]?.count || 1;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      {/* ---------- Cabecera ---------- */}
      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-left">
        <Avatar user={user} size="h-28 w-28 text-4xl sm:h-32 sm:w-32" className="ring-4" />
        <div className="flex-1">
          <h1 className="font-display text-5xl leading-none tracking-wide">{user.name}</h1>
          <p className="mt-1 text-zinc-400">
            <span className="text-butaca-500">@{user.username}</span> · En Butaca desde {memberSince(user.createdAt)}
            {user.role === 'admin' && <span className="ml-2 rounded-full bg-butaca-500/15 px-2 py-0.5 text-xs text-butaca-500">Admin</span>}
          </p>
          {user.bio ? (
            <p className="mt-3 max-w-xl text-zinc-200">“{user.bio}”</p>
          ) : (
            isMe && <p className="mt-3 text-sm text-zinc-500">Todavía no tienes bio. Cuéntale al mundo qué cine te gusta.</p>
          )}
        </div>
        {isMe && <Link to="/ajustes" className="btn-ghost">✎ Editar perfil</Link>}
      </header>

      {/* ---------- Estadísticas ---------- */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value={stats.count} label={stats.count === 1 ? 'vista' : 'vistas'} />
        <Stat value={`${stats.hours} h`} label="de cine" />
        <Stat value={stats.avgScore != null ? <ScoreBadge score={stats.avgScore} size="h-9 min-w-9 text-lg" /> : '—'} label="nota media" />
      </div>

      {/* ---------- Ratatús dice… ---------- */}
      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-butaca-500/30 bg-gradient-to-br from-butaca-700/25 to-telon p-5 sm:flex-row sm:items-center">
        <div className="mx-auto w-20 shrink-0 sm:mx-0"><Ratatus mood={tasteState.loading ? 'thinking' : taste ? 'happy' : 'idle'} /></div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-butaca-500">Ratatús dice…</p>
          {taste ? (
            <>
              <h2 className="mt-1 font-display text-3xl leading-none tracking-wide">«{taste.title}»</h2>
              <p className="mt-2 text-zinc-200">{taste.summary}</p>
            </>
          ) : (
            <p className="mt-1 text-zinc-300">
              {isMe
                ? 'Psst… pídeme tu perfil cinéfilo. Olfatearé tus vistas y te diré qué tipo de espectador eres.'
                : `${user.name.split(' ')[0]} todavía no le ha pedido a Ratatús su perfil cinéfilo.`}
            </p>
          )}
          {tasteState.error && <p role="alert" className="alert-error mt-2">{tasteState.error}</p>}
        </div>
        {isMe && !isVerified && <span className="text-xs text-amber-200">🔒 Confirma tu correo para pedírselo</span>}
        {isMe && isVerified && (
          <button onClick={askRatatus} disabled={tasteState.loading} className="btn-primary shrink-0">
            {tasteState.loading ? 'Olfateando…' : taste ? '🔄 Actualizar' : '🐀 ¿Qué tipo de espectador soy?'}
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* ---------- Top 3 ---------- */}
          <div>
            <h2 className="font-display text-3xl tracking-wide">🏆 {isMe ? 'Mi' : 'Su'} top 3</h2>
            {stats.top.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Aún no ha puntuado ninguna película.</p>
            ) : (
              <ol className="mt-3 grid grid-cols-3 gap-3 sm:gap-4">
                {stats.top.map((m, i) => (
                  <li key={m.tmdbId}>
                    <Link to={`/pelicula/${m.tmdbId}`} className="group relative block aspect-[2/3] overflow-hidden rounded-xl bg-telon ring-1 ring-white/10 hover:ring-butaca-500/60">
                      {m.poster && <img src={m.poster} alt={`Cartel de ${m.title}`} className="h-full w-full object-cover" />}
                      <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/80 font-display text-xl">{i + 1}</span>
                      <span className="absolute right-2 top-2"><ScoreBadge score={m.score} /></span>
                    </Link>
                    <p className="mt-1 line-clamp-1 text-sm font-medium">{m.title}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* ---------- Vistas recientemente ---------- */}
          {stats.recent.length > 0 && (
            <div>
              <h2 className="font-display text-3xl tracking-wide">Vistas recientemente</h2>
              <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-8">
                {stats.recent.map((m) => (
                  <li key={m.tmdbId}>
                    <Link to={`/pelicula/${m.tmdbId}`} title={m.title} className="relative block aspect-[2/3] overflow-hidden rounded-lg bg-telon ring-1 ring-white/10 hover:ring-butaca-500/60">
                      {m.poster && <img src={m.poster} alt={m.title} loading="lazy" className="h-full w-full object-cover" />}
                      {m.score != null && <span className="absolute bottom-1 right-1"><ScoreBadge score={m.score} size="h-6 min-w-6 text-xs" /></span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {/* ---------- Géneros favoritos ---------- */}
          <div className="rounded-2xl border border-white/10 bg-telon p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">🎭 Géneros favoritos</h2>
            {stats.genres.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Sin datos todavía.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {stats.genres.map((g) => (
                  <li key={g.name} className="text-sm">
                    <div className="flex justify-between"><span>{g.name}</span><span className="text-zinc-500">{g.count}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-butaca-500" style={{ width: `${(g.count / maxGenre) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ---------- Grupos en común ---------- */}
          {!isMe && commonGroups.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-telon p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">👥 Grupos en común</h2>
              <ul className="mt-3 space-y-2">
                {commonGroups.map((g) => (
                  <li key={g._id}>
                    <Link to={`/grupos/${g._id}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-white/5">
                      <GroupAvatar group={g} className="h-9 w-9 rounded-lg text-lg" />
                      <span className="text-sm font-medium">{g.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isMe && me && (
            <p className="text-center text-xs text-zinc-500">
              {me.profilePublic ? '🌍 Tu perfil lo pueden ver otros usuarios.' : '🔒 Tu perfil es privado.'}{' '}
              <Link to="/ajustes" className="text-butaca-500 hover:underline">Cambiar</Link>
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-telon p-4 text-center">
      <div className="flex justify-center font-display text-4xl tracking-wide">{value}</div>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}
