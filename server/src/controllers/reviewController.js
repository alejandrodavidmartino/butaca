import mongoose from 'mongoose';
import WatchedMovie from '../models/WatchedMovie.js';
import User from '../models/User.js';
import { HttpError } from '../utils/httpError.js';

const PAGE = 10;
const SORTS = {
  recent: { updatedAt: -1 },
  best: { score: -1, updatedAt: -1 },
  worst: { score: 1, updatedAt: -1 },
};

// IDs de usuarios bloqueados (sus notas y reseñas no cuentan)
const blockedUsers = () => User.find({ active: false }).distinct('_id');

// GET /api/movies/:id/reviews?sort=recent|best|worst&page=1   (público)
// Devuelve:
//  - summary: nota media de Butaca y cuántos dieron cada nota. Es anónimo: cuenta
//    TODAS las notas de los diarios, también las privadas, sin decir de quién son.
//  - reviews: solo las que su autor ha decidido publicar.
export async function movieReviews(req, res) {
  const tmdbId = parseInt(req.params.id);
  if (!tmdbId) throw new HttpError(400, 'Identificador no válido');
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const sort = SORTS[req.query.sort] || SORTS.recent;

  const blocked = await blockedUsers();
  const scored = { tmdbId, score: { $ne: null }, user: { $nin: blocked } };
  const publicFilter = {
    tmdbId,
    reviewPublic: true,
    hiddenByAdmin: { $ne: true },
    user: { $nin: blocked },
    $or: [{ score: { $ne: null } }, { comment: { $nin: ['', null] } }],
  };

  const [dist, total, reviews] = await Promise.all([
    WatchedMovie.aggregate([{ $match: scored }, { $group: { _id: '$score', n: { $sum: 1 } } }]),
    WatchedMovie.countDocuments(publicFilter),
    WatchedMovie.find(publicFilter)
      .sort(sort)
      .skip((page - 1) * PAGE)
      .limit(PAGE)
      .select('user score comment spoiler watchedAt updatedAt')
      .populate('user', 'name username avatarVersion')
      .lean(),
  ]);

  // Reparto de notas del 1 al 10
  const distribution = Array.from({ length: 10 }, (_, i) => dist.find((d) => d._id === i + 1)?.n || 0);
  const count = distribution.reduce((a, b) => a + b, 0);
  const avg = count ? Math.round((distribution.reduce((acc, n, i) => acc + n * (i + 1), 0) / count) * 10) / 10 : null;

  res.json({
    summary: { count, avg, distribution, reviews: total },
    reviews: reviews.filter((r) => r.user), // por si el usuario se borró a medias
    page,
    pages: Math.max(Math.ceil(total / PAGE), 1),
  });
}

// ---------- Moderación (admin) ----------

// GET /api/admin/reviews  -> reseñas públicas con texto, las más recientes primero
export async function listReviewsAdmin(req, res) {
  const filter = { reviewPublic: true, comment: { $nin: ['', null] } };
  if (req.query.hidden === 'true') filter.hiddenByAdmin = true;
  const rows = await WatchedMovie.find(filter)
    .sort({ updatedAt: -1 })
    .limit(100)
    .select('user tmdbId title poster score comment spoiler hiddenByAdmin updatedAt')
    .populate('user', 'name username avatarVersion')
    .lean();
  res.json(rows);
}

// PATCH /api/admin/reviews/:id  { hidden }  -> ocultar o volver a mostrar una reseña
export async function moderateReview(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Identificador no válido');
  const review = await WatchedMovie.findByIdAndUpdate(
    req.params.id,
    { hiddenByAdmin: Boolean(req.body.hidden) },
    { new: true }
  );
  if (!review) throw new HttpError(404, 'Reseña no encontrada');
  res.json({ message: review.hiddenByAdmin ? 'Reseña ocultada' : 'Reseña visible de nuevo', hiddenByAdmin: review.hiddenByAdmin });
}
