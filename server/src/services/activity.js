import GroupActivity from '../models/GroupActivity.js';

const movieSnapshot = (m) => (m ? { tmdbId: m.tmdbId, title: m.title, poster: m.poster } : undefined);

// Apunta algo en el historial del grupo. Nunca lanza error: si el historial falla,
// la acción principal (añadir la película, puntuar…) ya se ha hecho y no debe fallar por esto.
export async function logActivity(groupId, userId, type, { movie, target, data } = {}) {
  try {
    await GroupActivity.create({ group: groupId, user: userId, type, movie: movieSnapshot(movie), target, data });
  } catch (err) {
    console.warn('⚠️  No se pudo guardar la actividad del grupo:', err.message);
  }
}

// Para acciones que se pueden repetir (girar la ruleta, cambiar la nota…):
// si ya hay una entrada igual reciente, la sustituimos en vez de llenar el historial
export async function replaceActivity(groupId, userId, type, filter, extra, withinMs) {
  try {
    const since = withinMs ? { createdAt: { $gte: new Date(Date.now() - withinMs) } } : {};
    await GroupActivity.deleteMany({ group: groupId, user: userId, type, ...filter, ...since });
  } catch {
    // da igual: como mucho quedará una entrada repetida
  }
  return logActivity(groupId, userId, type, extra);
}

export const removeActivity = (filter) => GroupActivity.deleteMany(filter).catch(() => {});
