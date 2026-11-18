import { useEffect, useState } from 'react';
import { API_URL } from '../services/api';
import Ratatus from './Ratatus';

// En el plan gratuito de Render el servidor "se duerme" tras 15 min sin uso y tarda ~50 s en despertar.
// Si la API tarda en responder al abrir la web, mostramos un aviso amable en vez de una pantalla rota.
export default function ServerWakeBanner() {
  const [state, setState] = useState('checking'); // checking | waking | ready

  useEffect(() => {
    let done = false;
    const slow = setTimeout(() => !done && setState('waking'), 2500);
    const ping = async (attempt = 0) => {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        done = true;
        setState('ready');
      } catch {
        if (attempt < 20) setTimeout(() => ping(attempt + 1), 3000); // reintenta durante ~1 min
      }
    };
    ping();
    return () => clearTimeout(slow);
  }, []);

  if (state !== 'waking') return null;
  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/10 bg-telon/95 p-3 shadow-2xl backdrop-blur">
      <div className="w-12 shrink-0"><Ratatus mood="thinking" title="" /></div>
      <p className="text-sm text-zinc-200">
        <strong>Despertando el servidor…</strong>
        <br />
        <span className="text-zinc-400">Estaba echando la siesta bajo las butacas. Puede tardar hasta un minuto la primera vez.</span>
      </p>
    </div>
  );
}
