import { useState } from 'react';
import { rateMovie, unrateMovie } from '../services/groups';
import { getErrorMessage } from '../services/api';
import Modal from './Modal';
import Avatar from './Avatar';
import ScoreBadge, { scoreColor } from './ScoreBadge';

const LABELS = {
  1: 'Horrible', 2: 'Muy mala', 3: 'Mala', 4: 'Floja', 5: 'Pasable',
  6: 'Entretenida', 7: 'Buena', 8: 'Muy buena', 9: 'Excelente', 10: 'Obra maestra',
};

// Ventana de puntuación de una película del grupo:
// nota media del grupo + nota de cada miembro + formulario para la mía
export default function RatingModal({ group, tmdbId, me, onChange, onClose }) {
  const movie = group.movies.find((m) => m.tmdbId === tmdbId);
  const mine = movie?.ratings.find((r) => r.user?._id === me._id);

  const [score, setScore] = useState(mine?.score || null);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState(mine?.comment || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(!mine); // si ya voté, muestro el resumen primero

  if (!movie) return null;

  const save = async (e) => {
    e.preventDefault();
    if (!score) return setError('Elige una nota del 1 al 10');
    setSaving(true);
    setError('');
    try {
      onChange(await rateMovie(group._id, tmdbId, score, comment.trim()));
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      onChange(await unrateMovie(group._id, tmdbId));
      setScore(null);
      setComment('');
      setEditing(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Miembros que han votado (mejor nota primero) y los que faltan
  const ratings = [...movie.ratings].sort((a, b) => b.score - a.score);
  const missing = group.members.filter((m) => !movie.ratings.some((r) => r.user?._id === m._id));
  const shown = hover ?? score;

  return (
    <Modal title="Puntuación del grupo" onClose={onClose} wide>
      {/* ---------- Cabecera con la media ---------- */}
      <div className="flex gap-5">
        {movie.poster && <img src={movie.poster} alt="" className="h-36 w-24 shrink-0 rounded-lg object-cover" />}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h3 className="font-display text-3xl leading-none tracking-wide">{movie.title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{movie.year}</p>
          </div>
          <div className="mt-3 flex items-center gap-4">
            {movie.avgScore != null ? (
              <>
                <ScoreBadge score={movie.avgScore} size="h-16 min-w-16 text-3xl rounded-2xl" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-zinc-300">Nota del grupo</p>
                  <p className="text-sm text-zinc-500">
                    {movie.ratings.length} de {group.members.length} {group.members.length === 1 ? 'miembro ha' : 'miembros han'} votado
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-400">Nadie ha puntuado todavía. ¡Sé el primero!</p>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Mi nota ---------- */}
      <div className="mt-6 rounded-xl border border-white/10 bg-sala p-4">
        {editing ? (
          <form onSubmit={save}>
            <p className="text-sm font-semibold">¿Qué nota le das?</p>
            <div className="mt-3 grid grid-cols-10 gap-1" role="radiogroup" aria-label="Nota del 1 al 10" onMouseLeave={() => setHover(null)}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  type="button"
                  key={n}
                  role="radio"
                  aria-checked={score === n}
                  aria-label={`${n}: ${LABELS[n]}`}
                  onClick={() => setScore(n)}
                  onMouseEnter={() => setHover(n)}
                  className={`h-10 rounded-lg text-sm font-bold transition ${
                    shown && n <= shown ? scoreColor(shown) : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  } ${score === n ? 'scale-110 ring-2 ring-white' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-2 h-5 text-center text-sm text-zinc-300">{shown ? LABELS[shown] : ''}</p>

            <label htmlFor="comment" className="mt-2 block text-sm text-zinc-400">Comentario (opcional)</label>
            <textarea
              id="comment"
              rows={2}
              maxLength={280}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te ha parecido? Sin spoilers 😉"
              className="input mt-1 resize-none"
            />
            <p className="text-right text-xs text-zinc-500">{comment.length}/280</p>

            {error && <p role="alert" className="alert-error mt-2">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              {mine && <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancelar</button>}
              <button className="btn-primary" disabled={saving || !score}>
                {saving ? 'Guardando…' : mine ? 'Actualizar mi nota' : 'Guardar mi nota'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-3 text-sm">
              Tu nota: <ScoreBadge score={mine.score} /> <span className="text-zinc-400">{LABELS[mine.score]}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="btn-ghost text-xs">Cambiar</button>
              <button onClick={remove} className="btn-ghost text-xs text-zinc-400">Borrar</button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Notas de cada miembro ---------- */}
      <h4 className="mt-6 text-sm font-semibold uppercase tracking-widest text-zinc-400">Notas de los miembros</h4>
      <ul className="mt-3 space-y-3">
        {ratings.map((r) => (
          <li key={r._id} className="flex gap-3">
            <Avatar user={r.user} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{r.user?.name || 'Antiguo miembro'}</span>{' '}
                <span className="text-zinc-500">@{r.user?.username}</span>
                {r.user?._id === me._id && <span className="text-zinc-500"> (tú)</span>}
              </p>
              {r.comment && <p className="mt-0.5 text-sm text-zinc-300">«{r.comment}»</p>}
            </div>
            <ScoreBadge score={r.score} />
          </li>
        ))}
        {missing.map((m) => (
          <li key={m._id} className="flex items-center gap-3 opacity-50">
            <Avatar user={m} />
            <p className="flex-1 text-sm">
              <span className="font-medium">{m.name}</span> <span className="text-zinc-500">@{m.username}</span>
            </p>
            <span className="text-xs text-zinc-500">Aún no ha votado</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
