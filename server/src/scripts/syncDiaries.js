import Group from '../models/Group.js';
import WatchedMovie from '../models/WatchedMovie.js';

// Copia a "Mis vistas" las notas que cada usuario puso en sus grupos (sin pisar lo que ya tenga).
// Usa los datos guardados en el grupo, así que no hace llamadas a TMDB.
export async function syncGroupRatingsToDiaries() {
  const groups = await Group.find({ 'movies.ratings.0': { $exists: true } }).lean();
  const ops = [];
  for (const g of groups) {
    for (const m of g.movies) {
      for (const r of m.ratings || []) {
        ops.push({
          updateOne: {
            filter: { user: r.user, tmdbId: m.tmdbId },
            // $setOnInsert: solo se escribe si el registro no existía
            update: {
              $setOnInsert: {
                title: m.title, poster: m.poster, year: m.year, runtime: m.runtime, genres: m.genres,
                score: r.score, comment: r.comment, watchedAt: m.watchedAt || r.createdAt || new Date(),
              },
            },
            upsert: true,
          },
        });
      }
    }
  }
  if (!ops.length) return;
  const res = await WatchedMovie.bulkWrite(ops, { ordered: false });
  if (res.upsertedCount) console.log(`📔 ${res.upsertedCount} notas de grupos copiadas a "Mis vistas"`);
}
