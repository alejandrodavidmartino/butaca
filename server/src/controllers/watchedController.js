import WatchedMovie from '../models/WatchedMovie.js';
import { getMovieDetail } from '../services/tmdb.js';
import { HttpError } from '../utils/httpError.js';
import { getUserStats } from '../services/stats.js';

// Crea o actualiza una película en el diario del usuario.
// La usamos desde la API y también desde los grupos (al puntuar allí).
export async function upsertWatched(userId, tmdbId, { score, comment, watchedAt, reviewPublic, spoiler } = {}, { onlyIfMissing = false } = {}) {
  let entry = await WatchedMovie.findOne({ user: userId, tmdbId });
  if (entry && onlyIfMissing) return entry;

  if (!entry) {
    const movie = await getMovieDetail(tmdbId); // datos fiables desde TMDB, no desde el navegador
    entry = new WatchedMovie({
      user: userId,
      tmdbId,
      title: movie.title,
      poster: movie.poster,
      year: movie.year,
      runtime: movie.runtime,
      genres: movie.genres.map((g) => g.name),
    });
  }
  if (score !== undefined) entry.score = score === null || score === '' ? undefined : Number(score);
  if (comment !== undefined) entry.comment = String(comment).slice(0, 1000);
  if (reviewPublic !== undefined) entry.reviewPublic = Boolean(reviewPublic);
  if (spoiler !== undefined) entry.spoiler = Boolean(spoiler);
  if (watchedAt) {
    const date = new Date(watchedAt);
    if (Number.isNaN(date.getTime()) || date > new Date()) throw new HttpError(400, 'La fecha no es válida');
    entry.watchedAt = date;
  }
  await entry.save();
  return entry;
}

// GET /api/me/watched?sort=recent|best|worst&q=texto
export async function listWatched(req, res) {
  const sorts = {
    recent: { watchedAt: -1 },
    best: { score: -1, watchedAt: -1 },
    worst: { score: 1, watchedAt: -1 },
    title: { title: 1 },
  };
  const filter = { user: req.user._id };
  const q = String(req.query.q || '').trim();
  if (q) filter.title = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const movies = await WatchedMovie.find(filter)
    .sort(sorts[req.query.sort] || sorts.recent)
    .lean();
  // Las que no tienen nota, al final cuando ordenamos por nota
  if (req.query.sort === 'best' || req.query.sort === 'worst') {
    movies.sort((a, b) => (a.score == null) - (b.score == null));
  }
  res.json(movies);
}

// GET /api/me/watched/stats  -> estadísticas del diario
export async function watchedStats(req, res) {
  res.json(await getUserStats(req.user._id));
}

// GET /api/me/watched/:tmdbId  -> ¿la he visto? (para la ficha)
export async function getWatched(req, res) {
  const entry = await WatchedMovie.findOne({ user: req.user._id, tmdbId: Number(req.params.tmdbId) });
  res.json(entry); // null si no la ha visto
}

// PUT /api/me/watched/:tmdbId  { score?, comment?, watchedAt?, reviewPublic?, spoiler? }
export async function saveWatched(req, res) {
  const tmdbId = parseInt(req.params.tmdbId);
  if (!tmdbId) throw new HttpError(400, 'Película no válida');
  const { score, comment, watchedAt, reviewPublic, spoiler } = req.body;
  res.json(await upsertWatched(req.user._id, tmdbId, { score, comment, watchedAt, reviewPublic, spoiler }));
}

// DELETE /api/me/watched/:tmdbId
export async function deleteWatched(req, res) {
  const result = await WatchedMovie.deleteOne({ user: req.user._id, tmdbId: Number(req.params.tmdbId) });
  if (!result.deletedCount) throw new HttpError(404, 'Esa película no está en tus vistas');
  res.json({ message: 'Película quitada de tus vistas' });
}
