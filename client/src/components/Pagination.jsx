// Paginación sencilla: anterior / página actual / siguiente
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Paginación">
      <button className="btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Anterior</button>
      <span className="text-sm text-zinc-400">Página {page} de {totalPages}</span>
      <button className="btn-ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Siguiente →</button>
    </nav>
  );
}
