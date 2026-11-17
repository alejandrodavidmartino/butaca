import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { getStats } from '../services/admin';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import Avatar from '../components/Avatar';
import { AdminHeader } from './AdminLayout';

const shortDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

// Panel principal del Back-Office: cifras clave, altas de usuarios y lo más popular
export default function AdminDashboard() {
  const { data, loading, error } = useFetch(getStats);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  const t = data.totals;
  return (
    <>
      <AdminHeader title="Panel" subtitle="Resumen de la actividad de Butaca" />

      {/* ---------- Cifras clave (tiles: un número no necesita gráfico) ---------- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile value={t.users} label="Usuarios" hint={`${t.admins} admin · ${t.blocked} bloqueados`} to="/admin/usuarios" />
        <Tile value={t.groups} label="Grupos" to="/admin/moderacion" />
        <Tile value={t.watched} label="Películas vistas" hint="en los diarios" />
        <Tile value={t.collections} label="Colecciones" hint={`${t.published} publicadas`} to="/admin/colecciones" />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <SignupsChart days={data.signups} />

        <div className="space-y-6">
          {/* ---------- Películas más añadidas a grupos ---------- */}
          <section className="rounded-2xl border border-white/10 bg-telon p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Más añadidas a grupos</h2>
            {data.topMovies.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">Todavía no hay películas en grupos.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {data.topMovies.map((m, i) => (
                  <li key={m.tmdbId}>
                    <Link to={`/pelicula/${m.tmdbId}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-white/5">
                      <span className="w-5 text-center font-display text-xl text-zinc-500">{i + 1}</span>
                      {m.poster && <img src={m.poster} alt="" className="h-12 w-8 rounded object-cover" />}
                      <span className="flex-1 truncate text-sm">{m.title}</span>
                      <span className="text-sm tabular-nums text-zinc-400">{m.count} {m.count === 1 ? 'grupo' : 'grupos'}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ---------- Últimos registros ---------- */}
          <section className="rounded-2xl border border-white/10 bg-telon p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Últimos registros</h2>
            <ul className="mt-3 space-y-2">
              {data.recentUsers.map((u) => (
                <li key={u._id}>
                  <Link to={`/u/${u.username}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-white/5">
                    <Avatar user={u} size="h-8 w-8 text-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{u.name}</span>
                      <span className="block text-xs text-zinc-500">@{u.username}</span>
                    </span>
                    <span className="text-xs text-zinc-500">{new Date(u.createdAt).toLocaleDateString('es-ES')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function Tile({ value, label, hint, to }) {
  const content = (
    <>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 font-display text-5xl leading-none tracking-wide tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
    </>
  );
  const cls = 'block rounded-2xl border border-white/10 bg-telon p-5';
  return to ? <Link to={to} className={`${cls} transition hover:border-butaca-500/50`}>{content}</Link> : <div className={cls}>{content}</div>;
}

// Gráfico de barras de una sola serie (altas por día). Sin leyenda: el título dice qué se ve.
// Barras finas con extremo redondeado, eje discreto, tooltip al pasar el ratón y tabla accesible.
function SignupsChart({ days }) {
  const [hover, setHover] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const total = days.reduce((a, d) => a + d.count, 0);
  const max = Math.max(1, ...days.map((d) => d.count));
  const ticks = max <= 4 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, Math.round(max / 2), max];

  // Medidas del SVG (se escala al ancho del contenedor)
  const W = 640, H = 220, padL = 28, padB = 26, padT = 12;
  const plotW = W - padL - 8, plotH = H - padB - padT;
  const slot = plotW / days.length;
  const barW = Math.min(14, slot - 2); // fina y con hueco entre barras
  const y = (v) => padT + plotH - (v / max) * plotH;
  const peak = days.reduce((best, d, i) => (d.count > days[best].count ? i : best), 0);

  return (
    <section className="rounded-2xl border border-white/10 bg-telon p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-semibold">Nuevos usuarios por día</h2>
          <p className="text-sm text-zinc-400">Últimos 30 días · {total} {total === 1 ? 'registro' : 'registros'}</p>
        </div>
        <button onClick={() => setShowTable(!showTable)} className="text-xs text-butaca-500 hover:underline" aria-expanded={showTable}>
          {showTable ? 'Ver gráfico' : 'Ver como tabla'}
        </button>
      </div>

      {showTable ? (
        <div className="mt-4 max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-400"><tr><th className="py-1 font-medium">Día</th><th className="py-1 text-right font-medium">Registros</th></tr></thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date} className="border-t border-white/5"><td className="py-1">{shortDate(d.date)}</td><td className="py-1 text-right tabular-nums">{d.count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Gráfico de nuevos usuarios por día: ${total} en 30 días`} onMouseLeave={() => setHover(null)}>
            {/* Rejilla y eje Y, discretos */}
            {ticks.map((v) => (
              <g key={v}>
                <line x1={padL} x2={W - 8} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.08)" strokeWidth="1" />
                <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#71717a">{v}</text>
              </g>
            ))}
            {days.map((d, i) => {
              const x = padL + i * slot + (slot - barW) / 2;
              const h = (d.count / max) * plotH;
              const r = Math.min(4, h); // extremo redondeado de 4px, base recta
              return (
                <g key={d.date} onMouseEnter={() => setHover(i)}>
                  {/* Zona de hover más grande que la barra */}
                  <rect x={padL + i * slot} y={padT} width={slot} height={plotH} fill="transparent" />
                  {d.count > 0 && (
                    <path
                      d={`M${x},${y(0)} V${y(d.count) + r} Q${x},${y(d.count)} ${x + r},${y(d.count)} H${x + barW - r} Q${x + barW},${y(d.count)} ${x + barW},${y(d.count) + r} V${y(0)} Z`}
                      fill="#c81e3a"
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  )}
                </g>
              );
            })}
            {/* Etiqueta solo en el máximo (no un número en cada barra) */}
            {days[peak].count > 0 && (
              <text x={padL + peak * slot + slot / 2} y={y(days[peak].count) - 6} textAnchor="middle" fontSize="11" fill="#e4e4e7">{days[peak].count}</text>
            )}
            {/* Eje X: primera, mitad y última fecha */}
            {[0, 14, days.length - 1].map((i) => (
              <text key={i} x={padL + i * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#71717a">{shortDate(days[i].date)}</text>
            ))}
            <line x1={padL} x2={W - 8} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.2)" strokeWidth="1" />
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-sala px-3 py-1.5 text-xs shadow-xl"
              style={{ left: `${((padL + hover * slot + slot / 2) / W) * 100}%`, top: `${(y(days[hover].count) / H) * 100}%` }}
            >
              <p className="text-zinc-400">{shortDate(days[hover].date)}</p>
              <p className="font-semibold tabular-nums text-zinc-100">{days[hover].count} {days[hover].count === 1 ? 'registro' : 'registros'}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
