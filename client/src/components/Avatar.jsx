import { API_URL } from '../services/api';

// Avatar del usuario: su foto de perfil o, si no tiene, la inicial con un color fijo
const COLORS = ['bg-rose-600', 'bg-amber-600', 'bg-emerald-600', 'bg-sky-600', 'bg-violet-600', 'bg-fuchsia-600', 'bg-teal-600'];

// eslint-disable-next-line react-refresh/only-export-components
export const avatarUrl = (user) =>
  user?.avatarVersion ? `${API_URL}/users/${user._id}/avatar?v=${user.avatarVersion}` : null;

export default function Avatar({ user, size = 'h-9 w-9 text-sm', className = '' }) {
  const seed = [...(user?.username || '?')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const src = avatarUrl(user);
  return (
    <span
      title={user ? `${user.name} (@${user.username})` : ''}
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-sala ${src ? 'bg-telon' : COLORS[seed % COLORS.length]} ${size} ${className}`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : user?.name?.[0]?.toUpperCase() || '?'}
    </span>
  );
}
