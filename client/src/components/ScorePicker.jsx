import { useState } from 'react';
import { scoreColor } from './ScoreBadge';

// eslint-disable-next-line react-refresh/only-export-components
export const SCORE_LABELS = {
  1: 'Horrible', 2: 'Muy mala', 3: 'Mala', 4: 'Floja', 5: 'Pasable',
  6: 'Entretenida', 7: 'Buena', 8: 'Muy buena', 9: 'Excelente', 10: 'Obra maestra',
};

// Selector de nota del 1 al 10 (se colorea al pasar el ratón)
export default function ScorePicker({ value, onChange }) {
  const [hover, setHover] = useState(null);
  const shown = hover ?? value;
  return (
    <div>
      <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label="Nota del 1 al 10" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            type="button"
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}: ${SCORE_LABELS[n]}`}
            onClick={() => onChange(value === n ? null : n)}
            onMouseEnter={() => setHover(n)}
            className={`h-10 rounded-lg text-sm font-bold transition ${
              shown && n <= shown ? scoreColor(shown) : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            } ${value === n ? 'scale-110 ring-2 ring-white' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-2 h-5 text-center text-sm text-zinc-300">{shown ? SCORE_LABELS[shown] : 'Sin nota'}</p>
    </div>
  );
}
