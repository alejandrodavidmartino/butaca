// Middleware final: convierte cualquier error en una respuesta JSON clara
export function errorHandler(err, _req, res, _next) {
  if (err.message?.startsWith('Origen no permitido por CORS')) {
    return res.status(403).json({ message: err.message });
  }
  // Errores de validación de Mongoose (campos obligatorios, formato…)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join('. ');
    return res.status(400).json({ message });
  }
  // Id de MongoDB mal formado
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Identificador no válido' });
  }

  // Errores al llamar a TMDB (axios)
  if (err.isAxiosError) {
    const status = err.response?.status;
    if (status === 404) return res.status(404).json({ message: 'Película no encontrada' });
    if (status === 401) {
      console.error(
        'TMDB: credencial no válida. Revisa TMDB_READ_TOKEN (token largo "eyJ...") o TMDB_API_KEY ' +
          '(32 caracteres) en server/.env o en el Environment de Render'
      );
    } else {
      console.error('TMDB:', err.message);
    }
    return res.status(502).json({ message: 'No se pudo obtener la información de películas' });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Error interno del servidor' : err.message });
}

export function notFound(req, res) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}
