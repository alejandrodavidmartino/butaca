import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { addMovieToGroup, getMyGroups } from '../services/groups';
import { getErrorMessage } from '../services/api';

// Botón "Añadir a grupo" con desplegable de mis grupos (en la ficha de película)
export default function AddToGroup({ tmdbId, compact = false }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState(null);
  const [status, setStatus] = useState({}); // { [groupId]: 'ok' | 'mensaje de error' }
  const ref = useRef(null);

  useEffect(() => {
    if (open && !groups) getMyGroups().then(setGroups).catch(() => setGroups([]));
  }, [open, groups]);

  // Cerrar al pulsar fuera
  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const add = async (groupId) => {
    try {
      await addMovieToGroup(groupId, tmdbId);
      setStatus((s) => ({ ...s, [groupId]: 'ok' }));
    } catch (err) {
      setStatus((s) => ({ ...s, [groupId]: getErrorMessage(err) }));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className={compact ? 'btn-ghost px-3 py-1.5 text-xs' : 'btn-ghost px-5 py-3'} aria-expanded={open}>
        ＋ Añadir a un grupo
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-2 w-72 rounded-xl border border-white/10 bg-telon p-2 shadow-2xl">
          {!groups ? (
            <p className="p-3 text-sm text-zinc-400">Cargando grupos…</p>
          ) : groups.length === 0 ? (
            <p className="p-3 text-sm text-zinc-400">
              Aún no tienes grupos.{' '}
              <Link to="/grupos" className="text-butaca-500 hover:underline">Crea uno</Link>
            </p>
          ) : (
            groups.map((g) => (
              <button
                key={g._id}
                onClick={() => add(g._id)}
                disabled={status[g._id] === 'ok'}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5 disabled:opacity-80"
              >
                <span className="text-xl">{g.emoji}</span>
                <span className="flex-1">
                  <span className="block font-medium">{g.name}</span>
                  {status[g._id] && status[g._id] !== 'ok' && (
                    <span className="block text-xs text-red-300">{status[g._id]}</span>
                  )}
                </span>
                {status[g._id] === 'ok' && <span className="text-emerald-400">✓ Añadida</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
