// Cliente de Google Gemini.
// Usamos el endpoint "compatible con OpenAI" de Gemini: es una petición HTTP normal
// (fetch), la clave va en la cabecera Authorization y se puede pedir respuesta en JSON.
// Docs: https://ai.google.dev/gemini-api/docs/openai
// Modelo por defecto: GEMINI_MODEL en el .env (si no, el primero de FALLBACK_MODELS)
import { HttpError } from '../utils/httpError.js';

const URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// Modelos a probar en orden. Si uno está saturado (503), sin cuota (429) o ya no existe (404),
// pasamos al siguiente. Así la app sigue funcionando aunque Google tenga picos de demanda.
// Los "lite" son los más rápidos (2-4 s) y de sobra buenos para recomendar películas.
const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
const ATTEMPT_TIMEOUT_MS = 20000; // tiempo máximo por modelo antes de probar el siguiente
const TOTAL_BUDGET_MS = 50000;    // tiempo máximo total
const RETRYABLE = [404, 429, 500, 503];

/**
 * Pide a Gemini una respuesta en JSON.
 * @param {Array<{role: 'system'|'user'|'assistant', content: string}>} messages
 * @param {object} [options.schema] esquema JSON que debe cumplir la respuesta
 * @returns {Promise<object>} el JSON ya parseado
 */
export async function askGeminiJSON(messages, { temperature = 0.9, schema } = {}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new HttpError(503, 'La IA no está configurada (falta GEMINI_API_KEY en el .env)');
  }

  const models = [...new Set([process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean))];
  let lastStatus = null;
  const start = Date.now();

  for (const model of models) {
    if (Date.now() - start > TOTAL_BUDGET_MS) break;
    const res = await callGemini(model, messages, temperature, schema);
    if (res === 'timeout') {
      console.error(`Gemini [${model}] no respondió en ${ATTEMPT_TIMEOUT_MS / 1000} s, probamos otro`);
      lastStatus = 504;
      continue;
    }
    if (res.ok) {
      const data = await res.json();
      return parseJSON(data.choices?.[0]?.message?.content || '');
    }

    lastStatus = res.status;
    const body = await res.text();
    console.error(`Gemini [${model}] ${res.status}:`, body.slice(0, 200).replace(/\s+/g, ' '));
    if (res.status === 401 || res.status === 403) {
      console.error('Gemini: revisa GEMINI_API_KEY en el .env');
      break;
    }
    if (!RETRYABLE.includes(res.status)) break;
  }

  if ([429, 503, 504].includes(lastStatus)) {
    throw new HttpError(503, 'La IA está saturada ahora mismo. Espera un minuto y vuelve a probar');
  }
  throw new HttpError(502, 'La IA no ha podido responder');
}

async function callGemini(model, messages, temperature, schema) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
  try {
    return await fetch(URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        reasoning_effort: 'low', // menos "pensamiento" = respuestas más rápidas
        // Con un esquema, la API OBLIGA al modelo a respetar la estructura exacta del JSON
        response_format: schema
          ? { type: 'json_schema', json_schema: { name: 'respuesta', strict: true, schema } }
          : { type: 'json_object' },
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError') return 'timeout';
    console.error('Gemini: error de red', err.message);
    throw new HttpError(502, 'No se pudo contactar con la IA');
  } finally {
    clearTimeout(timeout);
  }
}

// A veces el modelo envuelve el JSON en ```json ... ```: lo limpiamos
function parseJSON(text) {
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new HttpError(502, 'La IA ha devuelto una respuesta que no entendemos');
  }
}
