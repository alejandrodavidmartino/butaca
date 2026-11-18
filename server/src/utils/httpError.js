// Error con código HTTP, para lanzarlo desde los controladores.
// "code" es opcional: una etiqueta para que el frontend sepa qué ha pasado (p. ej. EMAIL_NOT_VERIFIED)
export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    if (code) this.code = code;
  }
}
