import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as groupsApi from '../services/groups';
import { searchMovies } from '../services/movies';
import { getErrorMessage } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import Rating from '../components/Rating';
import RandomPicker from '../components/RandomPicker';
import RatingModal from '../components/RatingModal';
import ScoreBadge from '../components/ScoreBadge';
import Ratatus from '../components/Ratatus';
import RatatusPopup from '../components/RatatusPopup';
import { VerifyRequired } from '../components/VerifyEmailNotice';
import GroupPhoto from '../components/GroupPhoto';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [tab, setTab] = useState('pending');
  const [modal, setModal] = useState(null); // 'random' | 'add' | null
  const [ratingFor, setRatingFor] = useState(null); // tmdbId de la película que se está puntuando

  useEffect(() => {
    groupsApi.getGroup(id).then(setGroup).catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  // Ejecuta una acción que devuelve el grupo actualizado
  const run = async (fn) => {
    setActionError('');
    try {
      setGroup(await fn());
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  // Al marcar como vista, abrimos directamente la ventana de puntuación
  const markWatched = async (tmdbId, watched) => {
    setActionError('');
    try {
      setGroup(await groupsApi.setWatched(id, tmdbId, watched));
      if (watched) setRatingFor(tmdbId);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  if (error) return <ErrorMessage message={error} />;
  if (!group) return <Spinner />;

  const isOwner = group.owner._id === user._id;
  const pending = group.movies.filter((m) => !m.watched);
  const watched = group.movies.filter((m) => m.watched);
  // Pendientes: últimas añadidas primero. Vistas: últimas vistas primero.
  const list =
    tab === 'pending'
      ? pending.slice().reverse()
      : watched.slice().sort((a, b) => new Date(b.watchedAt || 0) - new Date(a.watchedAt || 0));
  // Ranking del grupo: vistas con al menos una nota, de mayor a menor media
  const ranking = watched.filter((m) => m.avgScore != null).sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);

  const leave = async () => {
    if (!confirm(isOwner && group.members.length > 1
      ? 'Eres el creador: el grupo pasará al siguiente miembro. ¿Seguro que quieres salir?'
      : '¿Seguro que quieres salir del grupo?')) return;
    await groupsApi.removeMember(group._id, user._id);
    navigate('/grupos');
  };

  const remove = async () => {
    if (!confirm(`¿Borrar «${group.name}» para todos? No se puede deshacer.`)) return;
    await groupsApi.deleteGroup(group._id);
    navigate('/grupos');
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <Link to="/grupos" className="text-sm text-zinc-400 hover:text-white">← Mis grupos</Link>

      {/* ---------- Cabecera ---------- */}
      <header className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <GroupPhoto group={group} canEdit={isOwner} onChange={setGroup} onError={setActionError} />
          <div>
            <h1 className="font-display text-5xl leading-none tracking-wide">{group.name}</h1>
            {group.description && <p className="mt-1 text-zinc-400">{group.description}</p>}
            <p className="mt-1 text-sm text-zinc-500">
              {group.members.length} miembros · {pending.length} pendientes · {watched.length} vistas
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModal('add')} className="btn-ghost px-5 py-3">＋ Añadir película</button>
          <button
            onClick={() => setModal('random')}
            disabled={pending.length === 0}
            className="btn-primary px-6 py-3 text-base"
            title={pending.length === 0 ? 'Añade películas pendientes primero' : ''}
          >
            🎲 Película aleatoria
          </button>
        </div>
      </header>

      {actionError && <p role="alert" className="alert-error mt-6">{actionError}</p>}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ---------- Películas ---------- */}
        <div>
          <div role="tablist" className="flex gap-2 border-b border-white/10">
            {[['pending', `Pendientes (${pending.length})`], ['watched', `Vistas (${watched.length})`]].map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                  tab === key ? 'border-butaca-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <GroupAI group={group} onAdd={(tmdbId) => groupsApi.addMovieToGroup(group._id, tmdbId).then(setGroup)} />

          {tab === 'watched' && ranking.length > 1 && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-telon p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">🏆 Ranking del grupo</h2>
              <ol className="mt-3 space-y-2">
                {ranking.map((m, i) => (
                  <li key={m.tmdbId}>
                    <button onClick={() => setRatingFor(m.tmdbId)} className="flex w-full items-center gap-3 rounded-lg p-1 text-left hover:bg-white/5">
                      <span className="w-6 text-center font-display text-2xl text-zinc-500">{i + 1}</span>
                      {m.poster && <img src={m.poster} alt="" className="h-12 w-8 rounded object-cover" />}
                      <span className="flex-1 truncate text-sm font-medium">{m.title}</span>
                      <span className="text-xs text-zinc-500">{m.ratings.length} votos</span>
                      <ScoreBadge score={m.avgScore} />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {list.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center text-zinc-400">
              {tab === 'pending' ? (
                <>
                  <p>No hay películas pendientes.</p>
                  <button onClick={() => setModal('add')} className="btn-primary mt-4">＋ Añadir la primera</button>
                </>
              ) : (
                <p>Aún no habéis visto ninguna película juntos.</p>
              )}
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
              {list.map((m) => {
                return (
                  <li key={m.tmdbId} className="group">
                    <Link to={`/pelicula/${m.tmdbId}`} className="relative block aspect-[2/3] overflow-hidden rounded-xl bg-telon ring-1 ring-white/5 hover:ring-butaca-500/60">
                      {m.poster && <img src={m.poster} alt={`Cartel de ${m.title}`} loading="lazy" className="h-full w-full object-cover" />}
                      {m.watched && <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-xs text-emerald-400">✓ Vista</span>}
                    </Link>
                    {m.watched && (
                      <button
                        onClick={() => setRatingFor(m.tmdbId)}
                        className="-mt-12 relative ml-2 flex items-center gap-2 rounded-lg bg-black/80 py-1 pl-1 pr-2 text-xs backdrop-blur hover:bg-black"
                        aria-label={`Ver puntuaciones de ${m.title}`}
                      >
                        {m.avgScore != null ? (
                          <>
                            <ScoreBadge score={m.avgScore} size="h-7 min-w-7 text-sm" />
                            <span className="text-zinc-300">{m.ratings.length} {m.ratings.length === 1 ? 'voto' : 'votos'}</span>
                          </>
                        ) : (
                          <span className="px-1 py-1 text-zinc-300">Sin notas</span>
                        )}
                      </button>
                    )}
                    <h3 className={`line-clamp-1 text-sm font-medium ${m.watched ? 'mt-3' : 'mt-2'}`}>{m.title}</h3>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{m.year} {m.runtime ? `· ${m.runtime} min` : ''}</span>
                      <Rating value={m.rating} />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                      <Avatar user={m.addedBy} size="h-5 w-5 text-[9px]" />
                      <span className="truncate">@{m.addedBy?.username || 'antiguo miembro'}</span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {m.watched ? (
                        <>
                          <button
                            onClick={() => setRatingFor(m.tmdbId)}
                            className="flex-1 rounded-md bg-butaca-500/15 px-2 py-1 text-xs font-medium text-red-200 hover:bg-butaca-500/25"
                          >
                            {(() => {
                              const mine = m.ratings.find((r) => r.user?._id === user._id);
                              return mine ? `Tu nota: ${mine.score}` : '★ Puntuar';
                            })()}
                          </button>
                          <button
                            onClick={() => markWatched(m.tmdbId, false)}
                            className="rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-400 hover:bg-white/10"
                            title="Volver a pendientes"
                            aria-label={`Marcar ${m.title} como no vista`}
                          >
                            ↩
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => markWatched(m.tmdbId, true)}
                          className="flex-1 rounded-md bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                        >
                          ✓ Vista
                        </button>
                      )}
                      {/* Cualquier miembro puede quitarla; si la puso otro, pedimos confirmación */}
                      <button
                        onClick={() =>
                          (m.addedBy?._id === user._id || confirm(`¿Quitar «${m.title}» del grupo? La añadió @${m.addedBy?.username || 'otro miembro'}.`)) &&
                          run(() => groupsApi.removeMovie(group._id, m.tmdbId))
                        }
                        className="rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-400 hover:bg-butaca-500/20 hover:text-red-300"
                        aria-label={`Quitar ${m.title} del grupo`}
                      >
                        🗑
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ---------- Lateral: invitación y miembros ---------- */}
        <aside className="space-y-6">
          <InviteBox group={group} isOwner={isOwner} onRegenerate={() => run(() => groupsApi.updateGroup(group._id, { regenerateCode: true }))} />
          <Members group={group} isOwner={isOwner} me={user} run={run} />
          <div className="flex flex-wrap gap-2">
            <button onClick={leave} className="btn-ghost text-xs">Salir del grupo</button>
            {isOwner && (
              <button onClick={remove} className="btn-ghost border-butaca-500/40 text-xs text-red-300 hover:bg-butaca-500/10">
                Borrar grupo
              </button>
            )}
          </div>
        </aside>
      </div>

      {modal === 'random' && (
        <RandomPicker
          group={group}
          onClose={() => setModal(null)}
          onWatched={(tmdbId) => markWatched(tmdbId, true)}
        />
      )}
      {ratingFor && (
        <RatingModal
          group={group}
          tmdbId={ratingFor}
          me={user}
          onChange={setGroup}
          onClose={() => setRatingFor(null)}
        />
      )}
      {modal === 'add' && (
        <AddMovieModal
          group={group}
          onClose={() => setModal(null)}
          onAdd={(tmdbId) => groupsApi.addMovieToGroup(group._id, tmdbId).then(setGroup)}
        />
      )}
    </section>
  );
}

// Código de invitación con botón de copiar enlace
function InviteBox({ group, isOwner, onRegenerate }) {
  const [copied, setCopied] = useState('');
  const link = `${window.location.origin}/unirse/${group.inviteCode}`;

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      prompt('Copia este texto:', text);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-telon p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Invita a tus amigos</h2>
      <p className="mt-3 text-center font-mono text-3xl font-bold tracking-[0.35em] text-white">{group.inviteCode}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => copy(group.inviteCode, 'code')} className="btn-ghost text-xs">
          {copied === 'code' ? '✓ Copiado' : 'Copiar código'}
        </button>
        <button onClick={() => copy(link, 'link')} className="btn-primary text-xs">
          {copied === 'link' ? '✓ Copiado' : 'Copiar enlace'}
        </button>
      </div>
      {isOwner && (
        <button onClick={onRegenerate} className="mt-3 w-full text-xs text-zinc-500 hover:text-zinc-300">
          Generar un código nuevo (el anterior dejará de funcionar)
        </button>
      )}
    </div>
  );
}

// Lista de miembros + buscador para añadir amigos por @usuario
function Members({ group, isOwner, me, run }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  // Búsqueda con "debounce": espera 300 ms a que dejes de escribir
  useEffect(() => {
    if (q.replace('@', '').length < 2) return setResults([]);
    const t = setTimeout(() => {
      groupsApi.searchUsers(q).then((users) =>
        setResults(users.filter((u) => !group.members.some((m) => m._id === u._id)))
      );
    }, 300);
    return () => clearTimeout(t);
  }, [q, group.members]);

  const add = (username) => {
    setQ('');
    setResults([]);
    run(() => groupsApi.addMember(group._id, username));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-telon p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Miembros</h2>

      <div className="relative mt-3">
        <label htmlFor="friend" className="sr-only">Añadir amigo por usuario</label>
        <input
          id="friend"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Añadir amigo: @usuario"
          autoComplete="off"
          className="input py-2 text-sm"
        />
        {results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-sala shadow-xl">
            {results.map((u) => (
              <li key={u._id}>
                <button onClick={() => add(u.username)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/5">
                  <Avatar user={u} size="h-7 w-7 text-xs" />
                  <span>
                    <span className="block font-medium">{u.name}</span>
                    <span className="block text-xs text-zinc-500">@{u.username}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {group.members.map((m) => (
          <li key={m._id} className="flex items-center gap-3">
            <Link to={`/u/${m.username}`} aria-hidden="true" tabIndex={-1}><Avatar user={m} /></Link>
            <span className="min-w-0 flex-1">
              <Link to={`/u/${m.username}`} className="block truncate text-sm font-medium hover:text-butaca-500">
                {m.name} {m._id === me._id && <span className="text-zinc-500">(tú)</span>}
              </Link>
              <span className="block truncate text-xs text-zinc-500">@{m.username}</span>
            </span>
            {m._id === group.owner._id ? (
              <span className="rounded-full bg-butaca-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-butaca-500">Creador</span>
            ) : (
              isOwner && (
                <button
                  onClick={() => confirm(`¿Expulsar a @${m.username}?`) && run(() => groupsApi.removeMember(group._id, m._id))}
                  className="text-xs text-zinc-500 hover:text-red-300"
                  aria-label={`Expulsar a ${m.name}`}
                >
                  Expulsar
                </button>
              )
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Buscador de TMDB dentro del grupo para añadir películas sin salir de la página
function AddMovieModal({ group, onClose, onAdd }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState({});
  const inGroup = new Set(group.movies.map((m) => m.tmdbId));

  useEffect(() => {
    if (q.trim().length < 2) return setResults([]);
    const t = setTimeout(() => searchMovies(q.trim()).then((d) => setResults(d.results.slice(0, 10))), 350);
    return () => clearTimeout(t);
  }, [q]);

  const add = async (m) => {
    setStatus((s) => ({ ...s, [m.id]: 'adding' }));
    try {
      await onAdd(m.id);
      setStatus((s) => ({ ...s, [m.id]: 'ok' }));
    } catch (err) {
      setStatus((s) => ({ ...s, [m.id]: getErrorMessage(err) }));
    }
  };

  return (
    <Modal title={`Añadir a «${group.name}»`} onClose={onClose} wide>
      <label htmlFor="msearch" className="sr-only">Buscar película</label>
      <input id="msearch" className="input" autoFocus placeholder="Escribe un título…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="mt-4 space-y-2">
        {results.map((m) => {
          const done = inGroup.has(m.id) || status[m.id] === 'ok';
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5">
              {m.poster ? <img src={m.poster} alt="" className="h-16 w-11 rounded object-cover" /> : <div className="h-16 w-11 rounded bg-sala" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.title}</p>
                <p className="text-xs text-zinc-500">{m.year || 'Sin fecha'}</p>
                {status[m.id] && !['ok', 'adding'].includes(status[m.id]) && <p className="text-xs text-red-300">{status[m.id]}</p>}
              </div>
              <button onClick={() => add(m)} disabled={done || status[m.id] === 'adding'} className={done ? 'text-sm text-emerald-400' : 'btn-primary text-xs'}>
                {done ? '✓ En el grupo' : status[m.id] === 'adding' ? '…' : '＋ Añadir'}
              </button>
            </li>
          );
        })}
      </ul>
      {q.trim().length >= 2 && results.length === 0 && <p className="mt-4 text-sm text-zinc-500">Sin resultados.</p>}
    </Modal>
  );
}

// Tarjeta de Ratatús: abre el pop-up con sus recomendaciones para el grupo
function GroupAI({ group, onAdd }) {
  const [open, setOpen] = useState(false);
  const { isVerified } = useAuth();
  if (!isVerified) return <div className="mt-6"><VerifyRequired what="pedir recomendaciones a Ratatús" compact /></div>;
  const rated = group.movies.filter((m) => m.ratings?.length).length;

  return (
    <>
      <div className="relative mt-6 flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border border-butaca-500/30 bg-gradient-to-br from-butaca-700/30 to-telon p-4 sm:flex-nowrap sm:pr-5">
        <button onClick={() => setOpen(true)} className="w-16 shrink-0 transition hover:-translate-y-1 sm:w-20" aria-label="Abrir recomendaciones de Ratatús">
          <Ratatus />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-butaca-500">Recomendaciones de Ratatús</p>
          <h2 className="font-semibold">Nuestra rata experta en cine tiene ideas para vosotros</h2>
          <p className="text-sm text-zinc-400">
            {rated > 0
              ? `Ha olfateado ${rated === 1 ? 'vuestra película puntuada' : `vuestras ${rated} películas puntuadas`} y lo que tenéis pendiente.`
              : 'Puntuad algunas películas vistas y afinará mucho más el olfato.'}
          </p>
        </div>
        <button onClick={() => setOpen(true)} disabled={group.movies.length === 0} className="btn-primary w-full shrink-0 py-3 sm:w-auto sm:py-2">
          🐀 ¡Recomiéndanos!
        </button>
      </div>
      {open && <RatatusPopup group={group} onAdd={onAdd} onClose={() => setOpen(false)} />}
    </>
  );
}
