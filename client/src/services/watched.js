import api from './api';

const data = (r) => r.data;

// Diario personal "Mis vistas"
export const getMyWatched = (params) => api.get('/me/watched', { params }).then(data);
export const getWatchedStats = () => api.get('/me/watched/stats').then(data);
export const getWatchedEntry = (tmdbId) => api.get(`/me/watched/${tmdbId}`).then(data);
export const saveWatched = (tmdbId, body) => api.put(`/me/watched/${tmdbId}`, body).then(data);
export const deleteWatched = (tmdbId) => api.delete(`/me/watched/${tmdbId}`).then(data);
