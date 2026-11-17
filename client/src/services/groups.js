import api from './api';

const data = (r) => r.data;

export const getMyGroups = () => api.get('/groups').then(data);
export const createGroup = (body) => api.post('/groups', body).then(data);
export const getGroup = (id) => api.get(`/groups/${id}`).then(data);
export const updateGroup = (id, body) => api.patch(`/groups/${id}`, body).then(data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`).then(data);
export const joinGroup = (code) => api.post('/groups/join', { code }).then(data);

export const addMember = (id, username) => api.post(`/groups/${id}/members`, { username }).then(data);
export const removeMember = (id, userId) => api.delete(`/groups/${id}/members/${userId}`).then(data);

export const addMovieToGroup = (id, tmdbId) => api.post(`/groups/${id}/movies`, { tmdbId }).then(data);
export const setWatched = (id, tmdbId, watched) =>
  api.patch(`/groups/${id}/movies/${tmdbId}`, { watched }).then(data);
export const removeMovie = (id, tmdbId) => api.delete(`/groups/${id}/movies/${tmdbId}`).then(data);

export const randomFromGroup = (id, params) => api.get(`/groups/${id}/random`, { params }).then(data);

export const searchUsers = (q) => api.get('/users/search', { params: { q } }).then(data);
