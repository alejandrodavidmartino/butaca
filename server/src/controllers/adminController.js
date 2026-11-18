import User from '../models/User.js';
import Group from '../models/Group.js';
import GroupImage from '../models/GroupImage.js';
import WatchedMovie from '../models/WatchedMovie.js';
import Collection from '../models/Collection.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import { getMovieDetail } from '../services/tmdb.js';
import { deleteUserAndData } from '../services/users.js';
import { HttpError } from '../utils/httpError.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pageParams = (q) => {
  const page = Math.max(parseInt(q.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// ======================= PANEL (estadísticas) =======================

// GET /api/admin/stats
export async function stats(_req, res) {
  const since = new Date(Date.now() - 29 * 24 * 3600 * 1000);
  since.setHours(0, 0, 0, 0);

  const [users, admins, blocked, groups, watched, collections, published, signups, topMovies, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ active: false }),
    Group.countDocuments(),
    WatchedMovie.countDocuments(),
    Collection.countDocuments(),
    Collection.countDocuments({ published: true }),
    // Altas por día (últimos 30 días)
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Películas más añadidas a grupos
    Group.aggregate([
      { $unwind: '$movies' },
      { $group: { _id: '$movies.tmdbId', title: { $first: '$movies.title' }, poster: { $first: '$movies.poster' }, count: { $sum: 1 } } },
      { $sort: { count: -1, title: 1 } },
      { $limit: 5 },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select('name username avatarVersion createdAt').lean(),
  ]);

  // Rellenamos los días sin altas con 0 para que la gráfica sea continua
  const byDay = Object.fromEntries(signups.map((d) => [d._id, d.count]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since.getTime() + i * 24 * 3600 * 1000);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: byDay[key] || 0 };
  });

  res.json({
    totals: { users, admins, blocked, groups, watched, collections, published },
    signups: days,
    topMovies: topMovies.map((m) => ({ tmdbId: m._id, title: m.title, poster: m.poster, count: m.count })),
    recentUsers,
  });
}

// ======================= USUARIOS =======================

// GET /api/admin/users?q=&role=&status=&page=
export async function listUsers(req, res) {
  const { page, limit, skip } = pageParams(req.query);
  const filter = {};
  const q = String(req.query.q || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { username: rx }, { email: rx }];
  }
  if (['user', 'admin'].includes(req.query.role)) filter.role = req.query.role;
  if (req.query.status === 'blocked') filter.active = false;
  if (req.query.status === 'active') filter.active = true;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Cuántas vistas y grupos tiene cada uno (para dar contexto al admin)
  const ids = items.map((u) => u._id);
  const [watchedCounts, groupCounts] = await Promise.all([
    WatchedMovie.aggregate([{ $match: { user: { $in: ids } } }, { $group: { _id: '$user', n: { $sum: 1 } } }]),
    Group.aggregate([{ $match: { members: { $in: ids } } }, { $unwind: '$members' }, { $match: { members: { $in: ids } } }, { $group: { _id: '$members', n: { $sum: 1 } } }]),
  ]);
  const wc = Object.fromEntries(watchedCounts.map((x) => [String(x._id), x.n]));
  const gc = Object.fromEntries(groupCounts.map((x) => [String(x._id), x.n]));

  res.json({
    items: items.map(({ password: _p, ...u }) => ({ ...u, watchedCount: wc[String(u._id)] || 0, groupCount: gc[String(u._id)] || 0 })),
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
  });
}

// PATCH /api/admin/users/:id  { role?, active?, emailVerified? }
export async function updateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  const isSelf = String(user._id) === String(req.user._id);

  if (req.body.role !== undefined) {
    if (!['user', 'admin'].includes(req.body.role)) throw new HttpError(400, 'Rol no válido');
    if (isSelf && req.body.role !== 'admin') throw new HttpError(400, 'No puedes quitarte a ti mismo el rol de administrador');
    user.role = req.body.role;
  }
  if (req.body.active !== undefined) {
    if (isSelf && !req.body.active) throw new HttpError(400, 'No puedes bloquearte a ti mismo');
    user.active = Boolean(req.body.active);
  }
  // El admin puede marcar un correo como confirmado (p. ej. si el email llegó a spam y se perdió)
  if (req.body.emailVerified === true) user.emailVerified = true;
  await user.save();
  res.json(user);
}

// DELETE /api/admin/users/:id
export async function deleteUser(req, res) {
  if (String(req.params.id) === String(req.user._id)) {
    throw new HttpError(400, 'Para borrar tu propia cuenta usa los ajustes de tu perfil');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  await deleteUserAndData(user._id);
  res.json({ message: `Usuario @${user.username} eliminado` });
}

// ======================= CATEGORÍAS Y ETIQUETAS =======================

// GET /api/admin/categories  (con el nº de colecciones de cada una)
export async function listCategories(_req, res) {
  const [cats, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Collection.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);
  const c = Object.fromEntries(counts.map((x) => [String(x._id), x.n]));
  res.json(cats.map((cat) => ({ ...cat, collections: c[String(cat._id)] || 0 })));
}

const uniqueError = (err, what) => {
  if (err.code === 11000) throw new HttpError(409, `Ya existe ${what} con ese nombre`);
  throw err;
};

export async function createCategory(req, res) {
  const { name, description, emoji } = req.body;
  const cat = await Category.create({ name, description, emoji }).catch((e) => uniqueError(e, 'una categoría'));
  res.status(201).json(cat);
}

export async function updateCategory(req, res) {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new HttpError(404, 'Categoría no encontrada');
  for (const f of ['name', 'description', 'emoji']) if (req.body[f] !== undefined) cat[f] = req.body[f];
  await cat.save().catch((e) => uniqueError(e, 'una categoría'));
  res.json(cat);
}

// Al borrar una categoría, sus colecciones se quedan "sin categoría"
export async function deleteCategory(req, res) {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw new HttpError(404, 'Categoría no encontrada');
  await Collection.updateMany({ category: cat._id }, { $unset: { category: 1 } });
  res.json({ message: 'Categoría eliminada' });
}

export async function listTags(_req, res) {
  const [tags, counts] = await Promise.all([
    Tag.find().sort({ name: 1 }).lean(),
    Collection.aggregate([{ $unwind: '$tags' }, { $group: { _id: '$tags', n: { $sum: 1 } } }]),
  ]);
  const c = Object.fromEntries(counts.map((x) => [String(x._id), x.n]));
  res.json(tags.map((t) => ({ ...t, collections: c[String(t._id)] || 0 })));
}

export async function createTag(req, res) {
  const tag = await Tag.create({ name: req.body.name }).catch((e) => uniqueError(e, 'una etiqueta'));
  res.status(201).json(tag);
}

export async function updateTag(req, res) {
  const tag = await Tag.findById(req.params.id);
  if (!tag) throw new HttpError(404, 'Etiqueta no encontrada');
  if (req.body.name !== undefined) tag.name = req.body.name;
  await tag.save().catch((e) => uniqueError(e, 'una etiqueta'));
  res.json(tag);
}

// Al borrar una etiqueta, se quita de todas las colecciones
export async function deleteTag(req, res) {
  const tag = await Tag.findByIdAndDelete(req.params.id);
  if (!tag) throw new HttpError(404, 'Etiqueta no encontrada');
  await Collection.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });
  res.json({ message: 'Etiqueta eliminada' });
}

// ======================= COLECCIONES (contenido) =======================

const populateCollection = (q) => q.populate('category', 'name slug emoji').populate('tags', 'name slug');

// GET /api/admin/collections?q=&category=&status=
export async function listCollections(req, res) {
  const filter = {};
  const q = String(req.query.q || '').trim();
  if (q) filter.title = new RegExp(escapeRegex(q), 'i');
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status === 'published') filter.published = true;
  if (req.query.status === 'draft') filter.published = false;
  const items = await populateCollection(Collection.find(filter).sort({ updatedAt: -1 })).lean();
  res.json(items);
}

export async function getCollection(req, res) {
  const col = await populateCollection(Collection.findById(req.params.id));
  if (!col) throw new HttpError(404, 'Colección no encontrada');
  res.json(col);
}

// Campos editables de una colección
async function applyCollectionFields(col, body) {
  for (const f of ['title', 'description', 'emoji']) if (body[f] !== undefined) col[f] = body[f];
  for (const f of ['published', 'featured']) if (body[f] !== undefined) col[f] = Boolean(body[f]);
  if (body.category !== undefined) {
    if (body.category && !(await Category.exists({ _id: body.category }))) throw new HttpError(400, 'La categoría no existe');
    col.category = body.category || undefined;
  }
  if (body.tags !== undefined) {
    const tags = Array.isArray(body.tags) ? body.tags : [];
    if ((await Tag.countDocuments({ _id: { $in: tags } })) !== tags.length) throw new HttpError(400, 'Alguna etiqueta no existe');
    col.tags = tags;
  }
  // Las películas llegan como [{ tmdbId, note }]: los datos los pedimos nosotros a TMDB
  if (body.movies !== undefined) {
    const list = (Array.isArray(body.movies) ? body.movies : []).slice(0, 60);
    const existing = new Map(col.movies.map((m) => [m.tmdbId, m]));
    col.movies = await Promise.all(
      list.map(async ({ tmdbId, note = '' }) => {
        const id = parseInt(tmdbId);
        if (!id) throw new HttpError(400, 'Película no válida');
        const known = existing.get(id);
        if (known) return { ...known.toObject(), note };
        const m = await getMovieDetail(id);
        return { tmdbId: id, title: m.title, poster: m.poster, backdrop: m.backdrop, year: m.year, rating: m.rating, note };
      })
    );
  }
}

export async function createCollection(req, res) {
  const col = new Collection({ createdBy: req.user._id });
  await applyCollectionFields(col, req.body);
  await col.save();
  res.status(201).json(await populateCollection(Collection.findById(col._id)));
}

export async function updateCollection(req, res) {
  const col = await Collection.findById(req.params.id);
  if (!col) throw new HttpError(404, 'Colección no encontrada');
  await applyCollectionFields(col, req.body);
  await col.save();
  res.json(await populateCollection(Collection.findById(col._id)));
}

export async function deleteCollection(req, res) {
  const col = await Collection.findByIdAndDelete(req.params.id);
  if (!col) throw new HttpError(404, 'Colección no encontrada');
  res.json({ message: 'Colección eliminada' });
}

// ======================= MODERACIÓN =======================

// GET /api/admin/groups?q=
export async function listGroups(req, res) {
  const filter = {};
  const q = String(req.query.q || '').trim();
  if (q) filter.name = new RegExp(escapeRegex(q), 'i');
  const groups = await Group.find(filter).sort({ updatedAt: -1 }).limit(100).populate('owner', 'name username avatarVersion').lean();
  res.json(
    groups.map((g) => ({
      _id: g._id,
      name: g.name,
      emoji: g.emoji,
      imageVersion: g.imageVersion,
      description: g.description,
      owner: g.owner,
      members: g.members.length,
      movies: g.movies.length,
      comments: g.movies.reduce((acc, m) => acc + (m.ratings || []).filter((r) => r.comment).length, 0),
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }))
  );
}

export async function deleteGroupAdmin(req, res) {
  const group = await Group.findByIdAndDelete(req.params.id);
  if (!group) throw new HttpError(404, 'Grupo no encontrado');
  await GroupImage.deleteOne({ group: group._id });
  res.json({ message: `Grupo «${group.name}» eliminado` });
}

// GET /api/admin/comments  -> comentarios de las notas en grupos (los más recientes)
export async function listComments(_req, res) {
  const rows = await Group.aggregate([
    { $unwind: '$movies' },
    { $unwind: '$movies.ratings' },
    { $match: { 'movies.ratings.comment': { $nin: ['', null] } } },
    { $sort: { 'movies.ratings.updatedAt': -1 } },
    { $limit: 100 },
    {
      $lookup: { from: 'users', localField: 'movies.ratings.user', foreignField: '_id', as: 'author', pipeline: [{ $project: { name: 1, username: 1, avatarVersion: 1 } }] },
    },
    {
      $project: {
        groupId: '$_id', groupName: '$name', tmdbId: '$movies.tmdbId', movieTitle: '$movies.title',
        ratingId: '$movies.ratings._id', score: '$movies.ratings.score', comment: '$movies.ratings.comment',
        date: '$movies.ratings.updatedAt', author: { $first: '$author' },
      },
    },
  ]);
  res.json(rows);
}

// DELETE /api/admin/comments/:groupId/:ratingId  -> borra el comentario (la nota se mantiene)
export async function deleteComment(req, res) {
  const result = await Group.updateOne(
    { _id: req.params.groupId },
    { $set: { 'movies.$[].ratings.$[r].comment': '' } },
    { arrayFilters: [{ 'r._id': req.params.ratingId }] }
  );
  if (!result.matchedCount) throw new HttpError(404, 'Comentario no encontrado');
  res.json({ message: 'Comentario eliminado' });
}
