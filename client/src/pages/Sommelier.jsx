import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { askSommelier } from '../services/ai';
import { getErrorMessage } from '../services/api';
import AiRecommendation from '../components/AiRecommendation';
import AddToGroup from '../components/AddToGroup';
import Ratatus from '../components/Ratatus';

// Sugerencias rápidas para no empezar con la pantalla en blanco
const MOODS = ['😂 Reírme', '😱 Pasar miedo', '😭 Llorar a gusto', '🤯 Que me vuele la cabeza', '💘 Algo romántico', '🧘 Algo tranquilo'];
const COMPANY = ['Solo', 'En pareja', 'Con amigos', 'En familia con niños'];
const TIME = ['Menos de 1 h 30', 'Unas 2 horas', 'Me da igual'];

// Ejemplos para seguir la conversación
const FOLLOW_UPS = ['Algo más antiguo', 'Sin animación', 'Más cortas', 'Algo menos conocido', 'Más de este estilo'];

export default function Sommelier() {
  const { user } = useAuth();
  // Cada mensaje: { role: 'user' | 'assistant', content, recommendations? }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [prefs, setPrefs] = useState({ mood: '', company: '', time: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottom = useRef(null);

  // Baja hasta el último mensaje (solo cuando ya hay conversación)
  useEffect(() => {
    if (messages.length === 0) return;
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const send = async (content) => {
    content = content.trim();
    if (!content || loading) return;
    setError('');
    setText('');

    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);
    try {
      // Al servidor le mandamos el historial como texto. Las respuestas de la IA las resumimos
      // con los títulos recomendados, para que sepa qué nos ha propuesto ya.
      const history = next.map((m) => ({
        role: m.role,
        content: m.recommendations
          ? `${m.content}\nRecomendé: ${m.recommendations.map((r) => `${r.title} (${r.year})`).join(', ')}`
          : m.content,
      }));
      const answer = await askSommelier(history);
      setMessages([...next, { role: 'assistant', content: answer.message, recommendations: answer.recommendations }]);
    } catch (err) {
      setError(getErrorMessage(err));
      setMessages(messages); // deshacemos el mensaje del usuario para que pueda reintentarlo
      setText(content);
    } finally {
      setLoading(false);
    }
  };

  // Construye la primera petición a partir de los botones elegidos
  const sendPrefs = () => {
    const parts = [
      prefs.mood && `Me apetece ${prefs.mood.replace(/^\S+\s/, '').toLowerCase()}`,
      prefs.company && `voy a verla ${prefs.company.toLowerCase()}`,
      prefs.time && prefs.time !== 'Me da igual' && `tengo ${prefs.time.toLowerCase()}`,
      text.trim(),
    ].filter(Boolean);
    send(parts.join(', ') + '.');
  };

  const started = messages.length > 0;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <header className="text-center">
        <div className="mx-auto w-32"><Ratatus mood={loading ? 'thinking' : started ? 'happy' : 'idle'} /></div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-butaca-500">El sommelier de cine</p>
        <h1 className="font-display text-5xl tracking-wide sm:text-6xl">Pregúntale a Ratatús</h1>
        <p className="mx-auto mt-2 max-w-xl text-zinc-400">
          Psst, {user.name.split(' ')[0]}… Vivo bajo las butacas y me he visto todas las películas desde el suelo.
          Dime cómo te sientes, con quién estás y cuánto tiempo tienes, y te sirvo cinco pelis maridadas con tu noche.
        </p>
      </header>

      {/* ---------- Primer paso: elegir preferencias ---------- */}
      {!started && (
        <div className="mt-10 space-y-6 rounded-2xl border border-white/10 bg-telon p-6">
          <ChipGroup label="¿Qué te apetece?" options={MOODS} value={prefs.mood} onChange={(mood) => setPrefs({ ...prefs, mood })} />
          <ChipGroup label="¿Con quién?" options={COMPANY} value={prefs.company} onChange={(company) => setPrefs({ ...prefs, company })} />
          <ChipGroup label="¿Cuánto tiempo tienes?" options={TIME} value={prefs.time} onChange={(time) => setPrefs({ ...prefs, time })} />
          <div>
            <label htmlFor="extra" className="mb-2 block text-sm font-medium text-zinc-300">¿Algo más? (opcional)</label>
            <input
              id="extra"
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ej: me encantó Interstellar, nada de terror, que sea española…"
              onKeyDown={(e) => e.key === 'Enter' && sendPrefs()}
            />
          </div>
          <button
            onClick={sendPrefs}
            disabled={loading || (!prefs.mood && !prefs.company && !prefs.time && !text.trim())}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Ratatús está pensando…' : '🐀 Recomiéndame, Ratatús'}
          </button>
        </div>
      )}

      {/* ---------- Conversación ---------- */}
      {started && (
        <div className="mt-10 space-y-6" aria-live="polite">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-butaca-600 px-4 py-2.5 text-white">{m.content}</p>
              </div>
            ) : (
              <div key={i}>
                <div className="flex items-start gap-3">
                  <span className="w-11 shrink-0" aria-hidden="true"><Ratatus title="" /></span>
                  <p className="rounded-2xl rounded-tl-sm bg-telon px-4 py-2.5 text-zinc-200">{m.content}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {m.recommendations.map((r) => (
                    <AiRecommendation key={r.id} movie={r} action={<AddToGroup tmdbId={r.id} compact />} />
                  ))}
                </div>
                {m.recommendations.length === 0 && (
                  <p className="mt-3 text-sm text-zinc-500">No he encontrado esas películas en el catálogo. Prueba a pedírmelo de otra forma.</p>
                )}
              </div>
            )
          )}

          {loading && (
            <div className="flex items-center gap-3 text-zinc-400">
              <span className="w-11 shrink-0"><Ratatus mood="thinking" title="" /></span>
              <span className="flex gap-1" aria-label="Ratatús está pensando">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-butaca-500" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </span>
              <span className="text-sm">Ratatús rebusca debajo de las butacas…</span>
            </div>
          )}

          {/* Caja para seguir la conversación */}
          {!loading && (
            <div className="sticky bottom-4 rounded-2xl border border-white/10 bg-sala/95 p-3 shadow-2xl backdrop-blur">
              <div className="mb-2 flex flex-wrap gap-2">
                {FOLLOW_UPS.map((f) => (
                  <button key={f} onClick={() => send(f)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 hover:border-butaca-500 hover:text-white">
                    {f}
                  </button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2">
                <label htmlFor="msg" className="sr-only">Escribe a Ratatús</label>
                <input id="msg" className="input flex-1" value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Afina la recomendación: «algo de los 90», «más miedo»…" maxLength={500} />
                <button className="btn-primary px-5" disabled={!text.trim()}>Enviar</button>
                <button type="button" onClick={() => { setMessages([]); setText(''); }} className="btn-ghost" title="Empezar de nuevo">↺</button>
              </form>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="alert-error mt-6">{error}</p>}
      <div ref={bottom} />
      <p className="mt-10 text-center text-xs text-zinc-600">Ratatús usa Google Gemini. Hasta las ratas se equivocan.</p>
    </section>
  );
}

function ChipGroup({ label, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-zinc-300">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(value === o ? '' : o)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              value === o ? 'border-butaca-500 bg-butaca-500 text-white' : 'border-white/10 text-zinc-300 hover:border-white/30'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
