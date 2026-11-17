import User from '../models/User.js';
import UserAvatar from '../models/UserAvatar.js';
import WatchedMovie from '../models/WatchedMovie.js';
import Group from '../models/Group.js';
import GroupImage from '../models/GroupImage.js';
import { getUserStats } from '../services/stats.js';
import { askGeminiJSON } from '../services/gemini.js';
import { parseImageDataUrl, sendImage } from '../utils/image.js';
import { HttpError } from '../utils/httpError.js';

// ---------- Foto de perfil ----------

// PUT /api/auth/me/avatar  { image: "data:image/jpeg;base64,..." }
export async function uploadAvatar(req, res) {
  const { data, contentType } = parseImageDataUrl(req.body.image, 400 * 1024);
  await UserAvatar.findOneAndUpdate({ user: req.user._id }, { data, contentType }, { upsert: true, runValidators: true });
  req.user.avatarVersion = Date.now();
  await req.user.save();
  res.json({ user: req.user });
}

// DELETE /api/auth/me/avatar
export async function deleteAvatar(req, res) {
  await UserAvatar.deleteOne({ user: req.user._id });
  req.user.avatarVersion = null;
  await req.user.save();
  res.json({ user: req.user });
}

// GET /api/users/:id/avatar?v=...  (pública: la pide una etiqueta <img>)
export async function getAvatar(req, res) {
  const image = await UserAvatar.findOne({ user: req.params.id }).lean();
  if (!image) throw new HttpError(404, 'Este usuario no tiene foto');
  sendImage(res, image);
}

// ---------- Contraseña y cuenta ----------

// PATCH /api/auth/me/password  { current, next }
export async function changePassword(req, res) {
  const { current, next } = req.body;
  if (!current || !next) throw new HttpError(400, 'Escribe la contraseña actual y la nueva');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(current))) throw new HttpError(401, 'La contraseña actual no es correcta');
  if (current === next) throw new HttpError(400, 'La nueva contraseña debe ser distinta');
  user.password = next; // el modelo la valida (mín. 6) y la cifra al guardar
  await user.save();
  res.json({ message: 'Contraseña actualizada' });
}

// DELETE /api/auth/me  { password }  -> derecho al olvido (RGPD): borra la cuenta y sus datos
export async function deleteAccount(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.password || ''))) {
    throw new HttpError(401, 'La contraseña no es correcta');
  }
  const uid = user._id;

  // Sus notas en grupos se borran; las películas que añadió se quedan (aparecen como "antiguo miembro")
  await Group.updateMany({ 'movies.ratings.user': uid }, { $pull: { 'movies.$[].ratings': { user: uid } } });

  // Sale de sus grupos: si era el creador, el grupo pasa al siguiente; si se queda vacío, se borra
  for (const g of await Group.find({ members: uid })) {
    g.members = g.members.filter((m) => String(m) !== String(uid));
    if (g.members.length === 0) {
      await GroupImage.deleteOne({ group: g._id });
      await g.deleteOne();
    } else {
      if (String(g.owner) === String(uid)) g.owner = g.members[0];
      await g.save();
    }
  }

  await Promise.all([WatchedMovie.deleteMany({ user: uid }), UserAvatar.deleteOne({ user: uid })]);
  await user.deleteOne();
  res.json({ message: 'Tu cuenta y tus datos se han borrado. ¡Hasta pronto!' });
}

// ---------- Perfil público ----------

const PUBLIC_FIELDS = 'name username bio avatarVersion profilePublic tasteSummary createdAt role';

// GET /api/users/:username/profile  (requiere sesión)
export async function getProfile(req, res) {
  const user = await User.findOne({ username: String(req.params.username).toLowerCase(), active: true })
    .select(PUBLIC_FIELDS)
    .lean();
  if (!user) throw new HttpError(404, 'Este usuario no existe');

  const isMe = String(user._id) === String(req.user._id);
  if (!user.profilePublic && !isMe) {
    // Del perfil privado solo enseñamos lo básico
    return res.json({ user: { _id: user._id, name: user.name, username: user.username, avatarVersion: user.avatarVersion }, private: true, isMe });
  }

  // Grupos que tenemos en común (útil para "¿de qué le conozco?")
  const common = isMe
    ? []
    : await Group.find({ members: { $all: [user._id, req.user._id] } }).select('name emoji imageVersion').lean();

  res.json({ user, stats: await getUserStats(user._id), commonGroups: common, isMe, private: false });
}

// POST /api/users/me/taste  -> Ratatús escribe tu "perfil cinéfilo" a partir de tu diario
export async function generateTasteSummary(req, res) {
  const diary = await WatchedMovie.find({ user: req.user._id }).sort({ score: -1, watchedAt: -1 }).limit(60).lean();
  if (diary.length < 3) throw new HttpError(400, 'Marca al menos 3 películas como vistas para que Ratatús te conozca');

  const list = diary
    .map((m) => `- ${m.title} (${m.year}) [${(m.genres || []).join(', ')}]${m.score != null ? ` → ${m.score}/10` : ''}`)
    .join('\n');

  const answer = await askGeminiJSON(
    [
      {
        role: 'system',
        content: `Eres Ratatús, la rata mascota de Butaca que vive bajo las butacas del cine y lo ha visto todo.
Escribe el "perfil cinéfilo" de ${req.user.name}: 2-3 frases en español de España, en segunda persona,
con humor cariñoso y algún guiño ratonil (como mucho uno). Describe sus gustos con gracia a partir de su diario
(géneros, notas altas y bajas, contrastes curiosos). Añade un "title" corto y divertido tipo etiqueta
(p. ej. "Llorón de Pixar con alma de terror"). Nada de spoilers ni de hablar de ti como IA.`,
      },
      { role: 'user', content: `Su diario de películas:\n${list}` },
    ],
    {
      schema: {
        type: 'object',
        properties: { title: { type: 'string' }, summary: { type: 'string' } },
        required: ['title', 'summary'],
      },
    }
  );

  req.user.tasteSummary = JSON.stringify({ title: String(answer.title || '').slice(0, 80), summary: String(answer.summary || '').slice(0, 600) });
  req.user.tasteSummaryAt = new Date();
  await req.user.save();
  res.json({ user: req.user });
}
