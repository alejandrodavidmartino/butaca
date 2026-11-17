// Etiquetas "Disponible en" con el logo de cada plataforma.
// highlight: claves de las plataformas del usuario (se resaltan)
export default function PlatformBadges({ platforms = [], highlight = [], className = '' }) {
  if (!platforms.length) {
    return <p className={`text-xs text-zinc-500 ${className}`}>No está en plataformas de suscripción en España</p>;
  }
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-xs text-zinc-500">Disponible en</span>
      {platforms.map((p) => {
        const mine = highlight.includes(p.key);
        return (
          <span
            key={p.key}
            className={`flex items-center gap-1 rounded-md py-0.5 pl-0.5 pr-1.5 text-xs ${
              mine ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-white/5 text-zinc-300'
            }`}
            title={mine ? `La tienes en ${p.name}` : p.name}
          >
            {p.logo && <img src={p.logo} alt="" className="h-4 w-4 rounded" />}
            {p.name}
          </span>
        );
      })}
    </div>
  );
}
