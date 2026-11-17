import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white'
  }`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // menú móvil

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Inicio</NavLink>
      <NavLink to="/peliculas" className={linkClass} onClick={() => setOpen(false)}>Películas</NavLink>
      <NavLink to="/sommelier" className={linkClass} onClick={() => setOpen(false)}>🐀 Ratatús IA</NavLink>
      {user && <NavLink to="/grupos" className={linkClass} onClick={() => setOpen(false)}>Mis grupos</NavLink>}
      {user && <NavLink to="/mis-vistas" className={linkClass} onClick={() => setOpen(false)}>Mis vistas</NavLink>}
      {isAdmin && <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>Admin</NavLink>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-sala/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">{links}</div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-sm text-zinc-400">
                <strong className="text-white">@{user.username}</strong>
              </span>
              <button onClick={handleLogout} className="btn-ghost">Salir</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-ghost">Entrar</NavLink>
              <NavLink to="/registro" className="btn-primary">Crear cuenta</NavLink>
            </>
          )}
        </div>

        {/* Botón hamburguesa para móvil */}
        <button
          className="rounded-lg p-2 text-zinc-300 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d={open ? 'M6 6l12 12M6 18L18 6' : 'M4 7h16M4 12h16M4 17h16'} />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-white/5 px-4 py-3 md:hidden">
          {links}
          <div className="mt-2 flex gap-2 border-t border-white/5 pt-3">
            {user ? (
              <button onClick={handleLogout} className="btn-ghost w-full">Salir</button>
            ) : (
              <>
                <NavLink to="/login" className="btn-ghost flex-1" onClick={() => setOpen(false)}>Entrar</NavLink>
                <NavLink to="/registro" className="btn-primary flex-1" onClick={() => setOpen(false)}>Crear cuenta</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
