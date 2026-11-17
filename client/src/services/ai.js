import api from './api';

// La IA tarda unos segundos: damos más margen que a otras peticiones
const AI_TIMEOUT = 60000;

export const askSommelier = (messages) =>
  api.post('/ai/sommelier', { messages }, { timeout: AI_TIMEOUT }).then((r) => r.data);

export const recommendForGroup = (groupId) =>
  api.post(`/ai/groups/${groupId}/recommend`, null, { timeout: AI_TIMEOUT }).then((r) => r.data);
