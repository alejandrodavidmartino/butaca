import { useAuth } from '../context/AuthContext';

// Back-Office: lo desarrollaremos en el paso de administración
export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-butaca-500">Back-Office</p>
      <h1 className="mt-1 font-display text-5xl tracking-wide">Panel de administración</h1>
      <p className="mt-2 text-zinc-400">Sesión de administrador: {user.email}</p>
    </section>
  );
}
