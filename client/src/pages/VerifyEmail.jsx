import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import Ratatus from '../components/Ratatus';
import { ResendButton } from '../components/VerifyEmailNotice';

// /verificar?token=...  -> la página a la que lleva el enlace del correo
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { user, verifyEmail } = useAuth();
  const [state, setState] = useState({ status: 'loading', message: '' });
  const done = useRef(false); // evita confirmar dos veces (React StrictMode ejecuta los efectos 2 veces en desarrollo)

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    verifyEmail(params.get('token'))
      .then((d) => setState({ status: 'ok', message: d.message }))
      .catch((err) => setState({ status: 'error', message: getErrorMessage(err) }));
  }, [params, verifyEmail]);

  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto w-32">
        <Ratatus mood={state.status === 'loading' ? 'thinking' : state.status === 'ok' ? 'happy' : 'idle'} />
      </div>
      {state.status === 'loading' && <h1 className="mt-6 text-2xl font-semibold">Comprobando tu enlace…</h1>}
      {state.status === 'ok' && (
        <>
          <h1 className="mt-6 font-display text-5xl tracking-wide">¡Correo confirmado!</h1>
          <p className="mt-2 text-zinc-300">Ya puedes crear grupos, unirte a los de tus amigos y pedirme recomendaciones.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <>
                <Link to="/grupos" className="btn-primary px-6 py-3">Ir a mis grupos</Link>
                <Link to="/sommelier" className="btn-ghost px-6 py-3">🐀 Pregúntale a Ratatús</Link>
              </>
            ) : (
              <Link to="/login" className="btn-primary px-6 py-3">Iniciar sesión</Link>
            )}
          </div>
        </>
      )}
      {state.status === 'error' && (
        <>
          <h1 className="mt-6 text-2xl font-semibold">No hemos podido confirmar tu correo</h1>
          <p role="alert" className="mt-2 text-zinc-400">{state.message}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (user.emailVerified ? <Link to="/grupos" className="btn-primary">Tu correo ya está confirmado: ir a mis grupos</Link> : <ResendButton className="btn-primary px-6 py-3" />) : <Link to="/login" className="btn-primary">Inicia sesión para pedir otro enlace</Link>}
          </div>
        </>
      )}
    </section>
  );
}
