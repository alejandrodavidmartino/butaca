import { useEffect, useState } from 'react';
import { getWatchedEntry } from '../services/watched';
import WatchedModal from './WatchedModal';
import ScoreBadge from './ScoreBadge';

// Botón de la ficha: "La he visto" o, si ya está en el diario, "Vista · tu nota"
export default function WatchedButton({ movie }) {
  const [entry, setEntry] = useState(undefined); // undefined = cargando, null = no vista
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getWatchedEntry(movie.id).then(setEntry).catch(() => setEntry(null));
  }, [movie.id]);

  if (entry === undefined) return null;

  return (
    <>
      {entry ? (
        <button onClick={() => setOpen(true)} className="btn-ghost gap-2 border-emerald-500/40 px-4 py-3 text-emerald-300 hover:bg-emerald-500/10">
          ✓ Vista
          {entry.score != null ? <ScoreBadge score={entry.score} size="h-6 min-w-6 text-xs" /> : <span className="text-xs text-zinc-400">· puntuar</span>}
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-ghost px-5 py-3">👁 La he visto</button>
      )}
      {open && (
        <WatchedModal
          movie={{ tmdbId: movie.id, title: movie.title, poster: movie.poster, year: movie.year }}
          entry={entry}
          onSaved={setEntry}
          onDeleted={() => setEntry(null)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
