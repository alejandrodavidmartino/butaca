// Plataformas de suscripción en España que el usuario puede marcar como "las que tengo".
// TMDB a veces tiene varias entradas para la misma plataforma (p. ej. con anuncios o "Ficción Total"),
// así que agrupamos sus ids bajo una sola clave.
export const PLATFORMS = [
  { key: 'netflix', name: 'Netflix', ids: [8, 1796] },
  { key: 'prime', name: 'Prime Video', ids: [119, 2100] },
  { key: 'disney', name: 'Disney+', ids: [337] },
  { key: 'max', name: 'HBO Max', ids: [1899, 384] },
  { key: 'movistar', name: 'Movistar Plus+', ids: [2241, 149] },
  { key: 'appletv', name: 'Apple TV+', ids: [350] },
  { key: 'filmin', name: 'Filmin', ids: [63, 64] },
  { key: 'skyshowtime', name: 'SkyShowtime', ids: [1773] },
  { key: 'rtve', name: 'RTVE Play', ids: [541] },
  { key: 'atresplayer', name: 'Atresplayer', ids: [62] },
];

export const PLATFORM_KEYS = PLATFORMS.map((p) => p.key);

// Devuelve las plataformas (agrupadas) a las que pertenece un id de proveedor de TMDB
export const platformForProviderId = (id) => PLATFORMS.find((p) => p.ids.includes(id));
