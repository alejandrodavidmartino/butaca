export default function Spinner() {
  return (
    <div className="grid place-items-center py-24" role="status" aria-label="Cargando">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-butaca-500" />
    </div>
  );
}
