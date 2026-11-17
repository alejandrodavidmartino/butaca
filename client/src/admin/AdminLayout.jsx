import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const LINKS = [
  ['/admin', '📊', 'Panel', true],
  ['/admin/usuarios', '👤', 'Usuarios'],
  ['/admin/colecciones', '🎞️', 'Colecciones'],
  ['/admin/categorias', '🏷️', 'Categorías y etiquetas'],
  ['/admin/moderacion', '🛡️', 'Moderación'],
];

// Estructura del Back-Office: menú lateral (arriba en móvil) + contenido
export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <aside className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0 lg:self-start">
        <div className="mb-4 hidden items-center gap-3 rounded-2xl border border-butaca-500/30 bg-butaca-500/10 p-3 lg:flex">
          <Avatar user={user} size="h-10 w-10 text-sm" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-butaca-500">Back-Office</p>
            <p className="truncate text-sm">{user.name}</p>
          </div>
        </div>
        <nav aria-label="Administración" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {LINKS.map(([to, icon, label, end]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-butaca-500 text-white' : 'text-zinc-300 hover:bg-white/5'
                }`
              }
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

// Cabecera común de cada sección del panel
export function AdminHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl tracking-wide sm:text-5xl">{title}</h1>
        {subtitle && <p className="text-zinc-400">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
