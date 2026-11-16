import { useEffect, useState } from 'react';
import axios from 'axios';

export default function App() {
  const [status, setStatus] = useState('comprobando…');

  useEffect(() => {
    axios
      .get('/api/health')
      .then(({ data }) => setStatus(data.ok ? 'conectado ✅' : 'error'))
      .catch(() => setStatus('sin conexión ❌'));
  }, []);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="text-center">
        <h1 className="font-display text-7xl tracking-wide text-butaca-500">Butaca</h1>
        <p className="mt-2 text-zinc-400">Encuentra tu próxima película</p>
        <p className="mt-6 text-sm">Backend: {status}</p>
      </div>
    </main>
  );
}
