import ScoreBadge from './ScoreBadge';

// Botón de la ficha: "La he visto" o, si ya está en el diario, "Vista · tu nota".
// La ficha guarda la entrada (entry) porque la comparte con la sección de reseñas.
export default function WatchedButton({ entry, onOpen }) {
  if (entry === undefined) return null; // cargando

  return entry ? (
    <button onClick={onOpen} className="btn-ghost gap-2 border-emerald-500/40 px-4 py-3 text-emerald-300 hover:bg-emerald-500/10">
      ✓ Vista
      {entry.score != null ? <ScoreBadge score={entry.score} size="h-6 min-w-6 text-xs" /> : <span className="text-xs text-zinc-400">· puntuar</span>}
    </button>
  ) : (
    <button onClick={onOpen} className="btn-ghost px-5 py-3">👁 La he visto</button>
  );
}
