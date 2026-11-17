// Nota de TMDB (0-10) con color según lo buena que sea
export default function Rating({ value, className = '' }) {
  if (!value) return null;
  const color = value >= 7.5 ? 'text-emerald-400' : value >= 6 ? 'text-amber-400' : 'text-zinc-400';
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${color} ${className}`}>
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
        <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
      </svg>
      {value.toFixed(1)}
    </span>
  );
}
