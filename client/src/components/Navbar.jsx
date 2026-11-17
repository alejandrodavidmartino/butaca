import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ProfileMenu from './ProfileMenu';
import Avatar from './Avatar';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white'
  }`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // menú móvil
  const close = () => setOpen(false);

  // Enlaces principales (en escritorio). Lo personal está en el menú de perfil
  const mainLinks = (
    <>
      <NavLink to="/" end className={linkClass} onClick={close}>Inicio</NavLink>
      <NavLink to="/peliculas" className={linkClass} onClick={close}>Películas</NavLink>
      <NavLink to="/colecciones" className={linkClass} onClick={close}>Colecciones</NavLink>
      <NavLink to="/sommelier" className={linkClass} onClick={close}>🐀 Ratatús IA</NavLink>
      {user && <NavLink to="/grupos" className={linkClass} onClick={close}>Mis grupos</NavLink>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-sala/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">{mainLinks}</div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <ProfileMenu />
          ) : (
            <>
              <NavLink to="/login" className="btn-ghost">Entrar</NavLink>
              <NavLink to="/registro" className="btn-primary">Crear cuenta</NavLink>
            </>
          )}
        </div>

        {/* Botón hamburguesa para móvil (con la foto si hay sesión) */}
        <button
          className="flex items-center gap-2 rounded-lg p-1.5 text-zinc-300 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          {user && <Avatar user={user} size="h-8 w-8 text-sm" className="ring-0" />}
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d={open ? 'M6 6l12 12M6 18L18 6' : 'M4 7h16M4 12h16M4 17h16'} />
          </svg>
        </button>
      </nav>

      {/* ---------- Menú móvil ---------- */}
      {open && (
        <div className="flex flex-col gap-1 border-t border-white/5 px-4 py-3 md:hidden">
          {user && (
            <NavLink to={`/u/${user.username}`} onClick={close} className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <Avatar user={user} size="h-11 w-11 text-base" />
              <span>
                <span className="block font-semibold">{user.name}</span>
                <span className="block text-sm text-zinc-400">@{user.username} · Ver mi perfil</span>
              </span>
            </NavLink>
          )}
          {mainLinks}
          {user && (
            <>
              <NavLink to="/mis-vistas" className={linkClass} onClick={close}>👁 Mis vistas</NavLink>
              <NavLink to="/ajustes" className={linkClass} onClick={close}>⚙️ Ajustes</NavLink>
              {isAdmin && <NavLink to="/admin" className={linkClass} onClick={close}>🛠 Administración</NavLink>}
            </>
          )}
          <div className="mt-2 flex gap-2 border-t border-white/5 pt-3">
            {user ? (
              <button onClick={() => { logout(); close(); navigate('/'); }} className="btn-ghost w-full text-red-300">Cerrar sesión</button>
            ) : (
              <>
                <NavLink to="/login" className="btn-ghost flex-1" onClick={close}>Entrar</NavLink>
                <NavLink to="/registro" className="btn-primary flex-1" onClick={close}>Crear cuenta</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
