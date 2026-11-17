// Avatar con la inicial del nombre y un color fijo según el usuario
const COLORS = ['bg-rose-600', 'bg-amber-600', 'bg-emerald-600', 'bg-sky-600', 'bg-violet-600', 'bg-fuchsia-600', 'bg-teal-600'];

export default function Avatar({ user, size = 'h-9 w-9 text-sm', className = '' }) {
  const seed = [...(user?.username || '?')].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <span
      title={user ? `${user.name} (@${user.username})` : ''}
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ring-2 ring-sala ${COLORS[seed % COLORS.length]} ${size} ${className}`}
    >
      {user?.name?.[0]?.toUpperCase() || '?'}
    </span>
  );
}
