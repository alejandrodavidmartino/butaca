import Logo from './Logo';

// Tarjeta centrada con fondo de "sala de cine" para login y registro
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="relative grid min-h-[calc(100vh-4rem)] place-items-center overflow-hidden px-4 py-12">
      {/* Foco de luz de proyector */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-butaca-600/20 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-telon/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
