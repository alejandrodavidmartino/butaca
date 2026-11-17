import { HttpError } from '../utils/httpError.js';

// Límite sencillo de peticiones por usuario (en memoria).
// Protege la cuota gratuita de la IA de abusos: p. ej. 20 peticiones cada 10 minutos.
export function rateLimit({ max = 20, windowMs = 10 * 60 * 1000 } = {}) {
  const hits = new Map(); // userId -> [timestamps]

  return (req, _res, next) => {
    const key = String(req.user?._id || req.ip);
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (recent.length >= max) {
      const wait = Math.ceil((windowMs - (now - recent[0])) / 60000);
      throw new HttpError(429, `Has usado mucho la IA. Vuelve a intentarlo en ${wait} min`);
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
