import { useState } from 'react';
import { deleteWatched, saveWatched } from '../services/watched';
import { getErrorMessage } from '../services/api';
import Modal from './Modal';
import ScorePicker from './ScorePicker';

const today = () => new Date().toISOString().slice(0, 10);

// Ventana para añadir/editar una película en "Mis vistas" (nota, comentario y fecha)
// movie: { tmdbId, title, poster, year }   entry: registro existente o null
export default function WatchedModal({ movie, entry, onSaved, onDeleted, onClose }) {
  const [score, setScore] = useState(entry?.score ?? null);
  const [comment, setComment] = useState(entry?.comment || '');
  const [date, setDate] = useState(entry?.watchedAt ? entry.watchedAt.slice(0, 10) : today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      onSaved(await saveWatched(movie.tmdbId, { score, comment: comment.trim(), watchedAt: date }));
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`¿Quitar «${movie.title}» de tus vistas?`)) return;
    try {
      await deleteWatched(movie.tmdbId);
      onDeleted?.(movie.tmdbId);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Modal title={entry ? 'Editar en mis vistas' : 'La he visto'} onClose={onClose} wide>
      <form onSubmit={save}>
        <div className="flex gap-4">
          {movie.poster && <img src={movie.poster} alt="" className="h-28 w-[75px] shrink-0 rounded-lg object-cover" />}
          <div>
            <h3 className="font-display text-3xl leading-none tracking-wide">{movie.title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{movie.year}</p>
            <label htmlFor="wdate" className="mt-3 block text-xs text-zinc-400">¿Cuándo la viste?</label>
            <input id="wdate" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} className="input mt-1 w-auto py-1.5 [color-scheme:dark]" />
          </div>
        </div>

        <p className="mt-6 text-sm font-semibold">Tu nota <span className="font-normal text-zinc-500">(opcional)</span></p>
        <div className="mt-2"><ScorePicker value={score} onChange={setScore} /></div>

        <label htmlFor="wcomment" className="mt-2 block text-sm text-zinc-400">Comentario (opcional)</label>
        <textarea id="wcomment" rows={2} maxLength={280} value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="¿Qué te ha parecido? Es tu diario, nadie más lo ve" className="input mt-1 resize-none" />
        <p className="text-right text-xs text-zinc-500">{comment.length}/280</p>

        {error && <p role="alert" className="alert-error mt-2">{error}</p>}
        <div className="mt-4 flex flex-wrap justify-between gap-2">
          {entry ? <button type="button" onClick={remove} className="btn-ghost text-xs text-zinc-400">Quitar de mis vistas</button> : <span />}
          <button className="btn-primary px-6" disabled={saving}>{saving ? 'Guardando…' : entry ? 'Guardar cambios' : '✓ Añadir a mis vistas'}</button>
        </div>
      </form>
    </Modal>
  );
}
