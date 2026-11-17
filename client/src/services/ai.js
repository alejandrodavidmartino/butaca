import api from './api';

// La IA tarda unos segundos: damos más margen que a otras peticiones
const AI_TIMEOUT = 60000;

// platforms: claves de las plataformas que tiene el usuario (netflix, prime…). Vacío = sin filtro
export const askSommelier = (messages, platforms = []) =>
  api.post('/ai/sommelier', { messages, platforms }, { timeout: AI_TIMEOUT }).then((r) => r.data);

export const recommendForGroup = (groupId) =>
  api.post(`/ai/groups/${groupId}/recommend`, null, { timeout: AI_TIMEOUT }).then((r) => r.data);
