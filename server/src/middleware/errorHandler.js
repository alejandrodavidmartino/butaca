// Middleware final: convierte cualquier error en una respuesta JSON clara
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Errores de validación de Mongoose (campos obligatorios, formato…)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join('. ');
    return res.status(400).json({ message });
  }
  // Id de MongoDB mal formado
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Identificador no válido' });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Error interno del servidor' : err.message });
}

export function notFound(req, res) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}
