import useFetch from '../hooks/useFetch';
import { getPlatforms } from '../services/movies';

// Selector de plataformas de streaming (selección múltiple con logos)
export default function PlatformPicker({ value = [], onChange, compact = false }) {
  const { data: platforms } = useFetch(getPlatforms);

  const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);

  if (!platforms) {
    return <div className="h-12 animate-pulse rounded-xl bg-white/5" />;
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Plataformas que tienes">
      {platforms.map((p) => {
        const on = value.includes(p.key);
        return (
          <button
            key={p.key}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(p.key)}
            className={`flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-3 text-sm transition ${
              on ? 'border-butaca-500 bg-butaca-500/15 text-white' : 'border-white/10 text-zinc-400 hover:border-white/30 hover:text-zinc-200'
            }`}
          >
            {p.logo && (
              <img src={p.logo} alt="" className={`h-7 w-7 rounded-lg transition ${on ? '' : 'opacity-60 grayscale'}`} />
            )}
            {!compact && <span>{p.name}</span>}
            {on && <span className="text-butaca-500" aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
