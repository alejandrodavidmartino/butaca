import Group, { MAX_MEMBERS, MAX_MOVIES, generateInviteCode } from '../models/Group.js';
import GroupImage from '../models/GroupImage.js';
import User from '../models/User.js';
import { getMovieDetail } from '../services/tmdb.js';
import { HttpError } from '../utils/httpError.js';
import { upsertWatched } from './watchedController.js';
import { parseImageDataUrl, sendImage } from '../utils/image.js';

const USER_FIELDS = 'name username avatarVersion';

// Carga un grupo comprobando que existe y que el usuario es miembro
async function loadGroup(id, userId) {
  const group = await Group.findById(id);
  if (!group) throw new HttpError(404, 'Grupo no encontrado');
  if (!group.isMember(userId)) throw new HttpError(403, 'No perteneces a este grupo');
  return group;
}

// Devuelve el grupo completo con los datos de los usuarios
const populated = (group) =>
  group.populate([
    { path: 'owner', select: USER_FIELDS },
    { path: 'members', select: USER_FIELDS },
    { path: 'movies.addedBy', select: USER_FIELDS },
    { path: 'movies.ratings.user', select: USER_FIELDS },
  ]);

// GET /api/groups  -> mis grupos (resumen)
export async function myGroups(req, res) {
  const groups = await Group.find({ members: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('members', USER_FIELDS)
    .lean();

  res.json(
    groups.map((g) => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      emoji: g.emoji,
      imageVersion: g.imageVersion,
      isOwner: String(g.owner) === String(req.user._id),
      members: g.members,
      moviesCount: g.movies.length,
      pendingCount: g.movies.filter((m) => !m.watched).length,
      posters: g.movies.filter((m) => m.poster).slice(-4).map((m) => m.poster),
      updatedAt: g.updatedAt,
    }))
  );
}

// POST /api/groups  { name, description, emoji }
export async function createGroup(req, res) {
  const { name, description, emoji } = req.body;
  const count = await Group.countDocuments({ owner: req.user._id });
  if (count >= 20) throw new HttpError(400, 'Has llegado al máximo de 20 grupos creados');

  const group = await Group.create({
    name,
    description,
    emoji,
    owner: req.user._id,
    members: [req.user._id],
  });
  res.status(201).json(await populated(group));
}

// GET /api/groups/:id
export async function getGroup(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  res.json(await populated(group));
}

// PATCH /api/groups/:id  (solo el creador)
export async function updateGroup(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  if (!group.isOwner(req.user._id)) throw new HttpError(403, 'Solo el creador puede editar el grupo');

  for (const field of ['name', 'description', 'emoji']) {
    if (req.body[field] !== undefined) group[field] = req.body[field];
  }
  if (req.body.regenerateCode) group.inviteCode = generateInviteCode();
  await group.save();
  res.json(await populated(group));
}

// DELETE /api/groups/:id  (solo el creador)
export async function deleteGroup(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  if (!group.isOwner(req.user._id)) throw new HttpError(403, 'Solo el creador puede borrar el grupo');
  await GroupImage.deleteOne({ group: group._id });
  await group.deleteOne();
  res.json({ message: 'Grupo eliminado' });
}

// POST /api/groups/join  { code }  -> unirse con código de invitación
export async function joinByCode(req, res) {
  const code = String(req.body.code || '').trim().toUpperCase();
  const group = await Group.findOne({ inviteCode: code });
  if (!group) throw new HttpError(404, 'No hay ningún grupo con ese código');
  if (group.isMember(req.user._id)) return res.json(await populated(group));
  if (group.members.length >= MAX_MEMBERS) throw new HttpError(400, 'El grupo está completo');

  group.members.push(req.user._id);
  await group.save();
  res.json(await populated(group));
}

// POST /api/groups/:id/members  { username }  -> añadir a un amigo
export async function addMember(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  const username = String(req.body.username || '').trim().toLowerCase().replace(/^@/, '');

  const friend = await User.findOne({ username, active: true });
  if (!friend) throw new HttpError(404, `No existe el usuario @${username}`);
  if (group.isMember(friend._id)) throw new HttpError(409, `@${username} ya está en el grupo`);
  if (group.members.length >= MAX_MEMBERS) throw new HttpError(400, 'El grupo está completo');

  group.members.push(friend._id);
  await group.save();
  res.status(201).json(await populated(group));
}

// DELETE /api/groups/:id/members/:userId
// El creador puede expulsar a cualquiera; cualquiera puede salir él mismo.
export async function removeMember(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  const target = req.params.userId;
  const leaving = String(target) === String(req.user._id);

  if (!leaving && !group.isOwner(req.user._id)) {
    throw new HttpError(403, 'Solo el creador puede expulsar miembros');
  }

  group.members = group.members.filter((m) => String(m) !== String(target));

  // Si se queda vacío, se borra. Si se va el creador, el grupo pasa al siguiente miembro.
  if (group.members.length === 0) {
    await GroupImage.deleteOne({ group: group._id });
    await group.deleteOne();
    return res.json({ message: 'Grupo eliminado', deleted: true });
  }
  if (group.isOwner(target)) group.owner = group.members[0];

  await group.save();
  res.json(leaving ? { message: 'Has salido del grupo', left: true } : await populated(group));
}

// POST /api/groups/:id/movies  { tmdbId }
export async function addMovie(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  const tmdbId = parseInt(req.body.tmdbId);
  if (!tmdbId) throw new HttpError(400, 'Película no válida');
  if (group.movies.some((m) => m.tmdbId === tmdbId)) {
    throw new HttpError(409, 'Esa película ya está en el grupo');
  }
  if (group.movies.length >= MAX_MOVIES) throw new HttpError(400, 'La lista del grupo está llena');

  // Los datos los pedimos nosotros a TMDB: no nos fiamos de lo que mande el navegador
  const movie = await getMovieDetail(tmdbId);
  group.movies.push({
    tmdbId,
    title: movie.title,
    poster: movie.poster,
    year: movie.year,
    rating: movie.rating,
    runtime: movie.runtime,
    genres: movie.genres.map((g) => g.name),
    addedBy: req.user._id,
  });
  await group.save();
  res.status(201).json(await populated(group));
}

// PATCH /api/groups/:id/movies/:tmdbId  { watched }
export async function updateMovie(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  const movie = group.movies.find((m) => m.tmdbId === Number(req.params.tmdbId));
  if (!movie) throw new HttpError(404, 'Esa película no está en el grupo');

  movie.watched = Boolean(req.body.watched);
  movie.watchedAt = movie.watched ? new Date() : undefined;
  await group.save();
  res.json(await populated(group));
}

// Busca una película del grupo o lanza 404
function findMovie(group, tmdbId) {
  const movie = group.movies.find((m) => m.tmdbId === Number(tmdbId));
  if (!movie) throw new HttpError(404, 'Esa película no está en el grupo');
  return movie;
}

// PUT /api/groups/:id/movies/:tmdbId/rating  { score, comment }
// Crea o actualiza MI nota. Solo se pueden puntuar películas vistas.
export async function rateMovie(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  const movie = findMovie(group, req.params.tmdbId);
  if (!movie.watched) throw new HttpError(400, 'Marca la película como vista antes de puntuarla');

  const score = Number(req.body.score);
  const comment = String(req.body.comment || '').slice(0, 280);
  const mine = movie.ratings.find((r) => String(r.user) === String(req.user._id));

  if (mine) {
    mine.score = score;
    mine.comment = comment;
  } else {
    movie.ratings.push({ user: req.user._id, score, comment });
  }
  await group.save(); // aquí Mongoose valida que la nota sea un entero de 1 a 10

  // También va a "Mis vistas" del usuario, con la misma nota, si todavía no la tenía allí
  await upsertWatched(req.user._id, movie.tmdbId, { score, comment }, { onlyIfMissing: true }).catch(() => {});

  res.json(await populated(group));
}

// DELETE /api/groups/:id/movies/:tmdbId/rating  -> borrar MI nota
export async function unrateMovie(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  const movie = findMovie(group, req.params.tmdbId);
  movie.ratings = movie.ratings.filter((r) => String(r.user) !== String(req.user._id));
  await group.save();
  res.json(await populated(group));
}

// DELETE /api/groups/:id/movies/:tmdbId  (quien la añadió o el creador)
export async function removeMovie(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  const movie = group.movies.find((m) => m.tmdbId === Number(req.params.tmdbId));
  if (!movie) throw new HttpError(404, 'Esa película no está en el grupo');

  if (String(movie.addedBy) !== String(req.user._id) && !group.isOwner(req.user._id)) {
    throw new HttpError(403, 'Solo quien la añadió o el creador del grupo pueden quitarla');
  }
  movie.deleteOne();
  await group.save();
  res.json(await populated(group));
}

// GET /api/groups/:id/random?maxRuntime=120&genre=Comedia
// Elige al azar una película PENDIENTE del grupo (opcionalmente filtrando)
export async function randomMovie(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  const maxRuntime = parseInt(req.query.maxRuntime) || null;
  const genre = req.query.genre || null;

  const candidates = group.movies.filter(
    (m) =>
      !m.watched &&
      (!maxRuntime || !m.runtime || m.runtime <= maxRuntime) &&
      (!genre || m.genres.includes(genre))
  );
  if (candidates.length === 0) {
    throw new HttpError(404, 'No hay películas pendientes que cumplan esos filtros');
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  await group.populate({ path: 'movies.addedBy', select: USER_FIELDS });
  res.json({ movie: group.movies.id(pick._id), candidates: candidates.length });
}

// ---------- Foto del grupo ----------
const MAX_IMAGE_BYTES = 600 * 1024; // el navegador ya la reduce a ~50 KB; esto es un límite de seguridad

// PUT /api/groups/:id/image  { image: "data:image/jpeg;base64,..." }  (solo el creador)
export async function uploadImage(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  if (!group.isOwner(req.user._id)) throw new HttpError(403, 'Solo el creador puede cambiar la foto del grupo');

  const { data, contentType } = parseImageDataUrl(req.body.image, MAX_IMAGE_BYTES);

  await GroupImage.findOneAndUpdate(
    { group: group._id },
    { data, contentType },
    { upsert: true, runValidators: true }
  );
  group.imageVersion = Date.now();
  await group.save();
  res.json(await populated(group));
}

// DELETE /api/groups/:id/image  (solo el creador)
export async function deleteImage(req, res) {
  const group = await loadGroup(req.params.id, req.user._id);
  if (!group.isOwner(req.user._id)) throw new HttpError(403, 'Solo el creador puede quitar la foto del grupo');
  await GroupImage.deleteOne({ group: group._id });
  group.imageVersion = null;
  await group.save();
  res.json(await populated(group));
}

// GET /api/groups/:id/image?v=123  -> la imagen en sí (para la etiqueta <img>)
// Es pública porque una <img> no puede enviar el token; el id del grupo no se puede adivinar.
export async function getImage(req, res) {
  const image = await GroupImage.findOne({ group: req.params.id }).lean();
  if (!image) throw new HttpError(404, 'Este grupo no tiene foto');
  sendImage(res, image); // con caché larga: la URL cambia con cada foto nueva (?v=...)
}
