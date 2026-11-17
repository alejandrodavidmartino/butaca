// Nota del 1 al 10 con color: verde (buena), ámbar (normal), rojo (mala)
// eslint-disable-next-line react-refresh/only-export-components
export const scoreColor = (s) =>
  s >= 8 ? 'bg-emerald-500 text-emerald-950' : s >= 6 ? 'bg-amber-400 text-amber-950' : s >= 4 ? 'bg-orange-500 text-orange-950' : 'bg-red-600 text-white';

export default function ScoreBadge({ score, size = 'h-8 min-w-8 text-sm', className = '' }) {
  if (score == null) return null;
  return (
    <span className={`inline-grid place-items-center rounded-lg px-1.5 font-bold tabular-nums ${scoreColor(score)} ${size} ${className}`}>
      {Number.isInteger(score) ? score : score.toFixed(1)}
    </span>
  );
}
