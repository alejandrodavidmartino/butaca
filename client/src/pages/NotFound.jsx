import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="grid place-items-center px-4 py-32 text-center">
      <p className="font-display text-8xl text-butaca-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Esta sala está vacía</h1>
      <p className="mt-2 text-zinc-400">La página que buscas no existe o ha cambiado de sitio.</p>
      <Link to="/" className="btn-primary mt-8">Volver al inicio</Link>
    </section>
  );
}
