import axios from 'axios';

// Instancia de axios para hablar con nuestro backend.
// En desarrollo usa el proxy de Vite (/api); en producción, VITE_API_URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Antes de cada petición, si hay token guardado, lo añadimos a la cabecera
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('butaca_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Extrae un mensaje de error legible de la respuesta del servidor
export const getErrorMessage = (err) =>
  err.response?.data?.message || 'No se pudo conectar con el servidor';

export default api;
