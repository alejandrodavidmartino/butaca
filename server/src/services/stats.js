import WatchedMovie from '../models/WatchedMovie.js';

// Estadísticas del diario de un usuario (las usan "Mis vistas" y el perfil público)
export async function getUserStats(userId) {
  const all = await WatchedMovie.find({ user: userId }).lean();
  const rated = all.filter((m) => m.score != null);
  const minutes = all.reduce((acc, m) => acc + (m.runtime || 0), 0);

  const genreCount = {};
  all.forEach((m) => (m.genres || []).forEach((g) => (genreCount[g] = (genreCount[g] || 0) + 1)));
  const genres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const byScore = [...rated].sort((a, b) => b.score - a.score || new Date(b.watchedAt) - new Date(a.watchedAt));

  return {
    count: all.length,
    rated: rated.length,
    hours: Math.round(minutes / 60),
    avgScore: rated.length ? Math.round((rated.reduce((a, m) => a + m.score, 0) / rated.length) * 10) / 10 : null,
    topGenre: genres[0]?.name || null,
    genres: genres.slice(0, 6),
    best: byScore[0] || null,
    top: byScore.slice(0, 3).map(({ tmdbId, title, poster, year, score }) => ({ tmdbId, title, poster, year, score })),
    recent: [...all]
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .slice(0, 8)
      .map(({ tmdbId, title, poster, year, score, watchedAt }) => ({ tmdbId, title, poster, year, score, watchedAt })),
  };
}
