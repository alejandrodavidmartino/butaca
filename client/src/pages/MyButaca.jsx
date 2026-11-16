import { useAuth } from '../context/AuthContext';

// Zona exclusiva para usuarios registrados (favoritos, listas, IA… en próximos pasos)
export default function MyButaca() {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-5xl tracking-wide">Mi Butaca</h1>
      <p className="mt-2 text-zinc-400">
        Hola, {user.name}. Este es tu espacio personal.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ['❤️', 'Favoritas', 'Las películas que has guardado'],
          ['📝', 'Mis reseñas', 'Tus opiniones sobre lo que has visto'],
          ['🤖', 'Sommelier IA', 'Recomendaciones según tu estado de ánimo'],
        ].map(([icon, title, text]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-telon p-6">
            <div className="text-3xl">{icon}</div>
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{text}</p>
            <p className="mt-4 text-xs text-zinc-500">Próximamente</p>
          </div>
        ))}
      </div>
    </section>
  );
}
