import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

// Botón "Reenviar correo" con su mensaje de resultado
export function ResendButton({ className = 'btn-ghost px-3 py-1.5 text-xs' }) {
  const { resendVerification } = useAuth();
  const [state, setState] = useState({ sending: false, msg: '', error: false });

  const resend = async () => {
    setState({ sending: true, msg: '', error: false });
    try {
      setState({ sending: false, msg: await resendVerification(), error: false });
    } catch (err) {
      setState({ sending: false, msg: getErrorMessage(err), error: true });
    }
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button onClick={resend} disabled={state.sending} className={className}>
        {state.sending ? 'Enviando…' : '✉️ Reenviar correo'}
      </button>
      {state.msg && <span role="status" className={`text-xs ${state.error ? 'text-red-300' : 'text-emerald-400'}`}>{state.msg}</span>}
    </span>
  );
}

// Aviso fijo bajo la barra de navegación mientras el correo no esté confirmado
export default function VerifyEmailBanner() {
  const { user, isVerified } = useAuth();
  if (!user || isVerified) return null;
  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm">
        <span className="text-amber-200">
          📬 <strong>Confirma tu correo</strong> para crear grupos y usar Ratatús. Te lo enviamos a <strong>{user.email}</strong>{' '}
          <span className="text-amber-200/70">(mira también en spam)</span>.
        </span>
        <ResendButton />
      </div>
    </div>
  );
}

// Bloque que sustituye a una función bloqueada (opción B: sin verificar no hay grupos ni IA)
export function VerifyRequired({ what = 'usar esta función', compact = false }) {
  const { user } = useAuth();
  return (
    <div className={`rounded-2xl border border-amber-500/30 bg-amber-500/10 ${compact ? 'p-4' : 'p-6 text-center'}`}>
      <p className={compact ? 'text-sm text-amber-100' : 'text-amber-100'}>
        🔒 Confirma tu correo para {what}.
        <br className={compact ? 'hidden' : ''} />
        <span className="text-sm text-amber-200/80"> Te enviamos un enlace a <strong>{user?.email}</strong>.</span>
      </p>
      <div className={`mt-3 ${compact ? '' : 'flex justify-center'}`}><ResendButton /></div>
    </div>
  );
}
