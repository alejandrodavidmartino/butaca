import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { getPlatforms } from '../services/movies';
import Avatar from './Avatar';

// Menú de perfil (arriba a la derecha): foto + desplegable con opciones
export default function ProfileMenu() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data: platforms } = useFetch(getPlatforms);
  const myPlatforms = platforms?.filter((p) => user.platforms?.includes(p.key)) || [];

  // Cerrar al pulsar fuera, con Escape o al cambiar de página
  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  useEffect(() => setOpen(false), [location.pathname]);

  const item = 'flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 transition hover:border-white/30"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menú de perfil"
      >
        <Avatar user={user} size="h-8 w-8 text-sm" className="ring-0" />
        <span className="max-w-32 truncate text-sm font-medium">{user.name.split(' ')[0]}</span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 text-zinc-400 transition ${open ? 'rotate-180' : ''}`} fill="currentColor" aria-hidden="true">
          <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-telon shadow-2xl motion-safe:animate-[fade-up_150ms_ease-out]">
          <Link to={`/u/${user.username}`} className="flex items-center gap-3 border-b border-white/10 p-4 hover:bg-white/5" role="menuitem">
            <Avatar user={user} size="h-12 w-12 text-lg" />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{user.name}</span>
              <span className="block truncate text-sm text-zinc-400">@{user.username}</span>
            </span>
          </Link>
          <div className="py-1">
            <Link to={`/u/${user.username}`} className={item} role="menuitem">👤 Mi perfil</Link>
            <Link to="/mis-vistas" className={item} role="menuitem">👁 Mis vistas</Link>
            <Link to="/grupos" className={item} role="menuitem">👥 Mis grupos</Link>
            <Link to="/ajustes#plataformas" className={item} role="menuitem">
              📺 Mis plataformas
              <span className="ml-auto flex -space-x-1">
                {myPlatforms.slice(0, 4).map((p) => <img key={p.key} src={p.logo} alt={p.name} title={p.name} className="h-5 w-5 rounded ring-1 ring-telon" />)}
                {myPlatforms.length === 0 && <span className="text-xs text-zinc-500">Ninguna</span>}
              </span>
            </Link>
          </div>
          <div className="border-t border-white/10 py-1">
            <Link to="/ajustes" className={item} role="menuitem">⚙️ Ajustes de la cuenta</Link>
            {isAdmin && <Link to="/admin" className={item} role="menuitem">🛠 Panel de administración</Link>}
          </div>
          <div className="border-t border-white/10 py-1">
            <button onClick={() => { logout(); navigate('/'); }} className={`${item} w-full text-left text-red-300`} role="menuitem">🚪 Cerrar sesión</button>
          </div>
        </div>
      )}
    </div>
  );
}
