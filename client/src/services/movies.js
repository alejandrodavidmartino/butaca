import api from './api';

// Funciones para pedir películas a NUESTRO backend (que a su vez llama a TMDB)
export const getList = (list, page = 1) =>
  api.get(`/movies/list/${list}`, { params: { page } }).then((r) => r.data);

export const searchMovies = (q, page = 1) =>
  api.get('/movies/search', { params: { q, page } }).then((r) => r.data);

export const discoverMovies = (params) =>
  api.get('/movies/discover', { params }).then((r) => r.data);

export const getGenres = () => api.get('/movies/genres').then((r) => r.data);

export const getMovie = (id) => api.get(`/movies/${id}`).then((r) => r.data);
