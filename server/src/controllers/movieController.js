import * as tmdb from '../services/tmdb.js';
import { HttpError } from '../utils/httpError.js';

const LISTS = ['trending', 'popular', 'now_playing', 'top_rated', 'upcoming'];
const SORTS = ['popularity.desc', 'vote_average.desc', 'primary_release_date.desc', 'revenue.desc'];

// Convierte la página a un número válido entre 1 y 500
const parsePage = (p) => Math.min(Math.max(parseInt(p) || 1, 1), 500);

// GET /api/movies/list/:list  (trending, popular, now_playing, top_rated, upcoming)
export async function getList(req, res) {
  const { list } = req.params;
  if (!LISTS.includes(list)) throw new HttpError(400, 'Lista no válida');
  res.json(await tmdb.getList(list, parsePage(req.query.page)));
}

// GET /api/movies/search?q=texto&page=1
export async function search(req, res) {
  const q = req.query.q?.trim();
  if (!q) throw new HttpError(400, 'Escribe algo para buscar');
  res.json(await tmdb.searchMovies(q, parsePage(req.query.page)));
}

// GET /api/movies/discover?genre=28&sort=popularity.desc&year=2020&page=1
export async function discover(req, res) {
  const sort = SORTS.includes(req.query.sort) ? req.query.sort : 'popularity.desc';
  const year = parseInt(req.query.year) || undefined;
  const genre = parseInt(req.query.genre) || undefined;
  res.json(await tmdb.discoverMovies({ genre, sort, year, page: parsePage(req.query.page) }));
}

// GET /api/movies/genres
export async function genres(_req, res) {
  res.json(await tmdb.getGenres());
}

// GET /api/movies/:id
export async function detail(req, res) {
  const id = parseInt(req.params.id);
  if (!id) throw new HttpError(400, 'Identificador no válido');
  res.json(await tmdb.getMovieDetail(id));
}

// GET /api/movies/random?genre=35  -> "Sorpréndeme"
export async function random(req, res) {
  res.json(await tmdb.randomGoodMovie(parseInt(req.query.genre) || undefined));
}
