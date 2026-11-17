import mongoose from 'mongoose';
import crypto from 'node:crypto';

// Código de invitación corto y fácil de dictar: sin 0/O ni 1/I
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const generateInviteCode = () =>
  Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('');

// Puntuación de un miembro a una película vista del grupo
const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: {
      type: Number,
      required: true,
      min: [1, 'La nota mínima es 1'],
      max: [10, 'La nota máxima es 10'],
      validate: { validator: Number.isInteger, message: 'La nota debe ser un número entero' },
    },
    comment: { type: String, trim: true, maxlength: [280, 'El comentario puede tener 280 caracteres'], default: '' },
  },
  { timestamps: true }
);

// Película guardada dentro de un grupo. Guardamos una "foto" de los datos de TMDB
// para pintar la lista sin tener que llamar a TMDB por cada película.
const groupMovieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    poster: String,
    year: String,
    rating: Number,
    runtime: Number,
    genres: [String],
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    watched: { type: Boolean, default: false },
    watchedAt: Date,
    ratings: [ratingSchema],
  },
  { timestamps: { createdAt: 'addedAt', updatedAt: false } }
);

// Nota media del grupo (campo virtual: se calcula, no se guarda)
groupMovieSchema.virtual('avgScore').get(function () {
  if (!this.ratings?.length) return null;
  const sum = this.ratings.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});
groupMovieSchema.set('toJSON', { virtuals: true });

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El grupo necesita un nombre'],
      trim: true,
      maxlength: [40, 'El nombre puede tener como mucho 40 caracteres'],
    },
    description: { type: String, trim: true, maxlength: 160, default: '' },
    emoji: { type: String, default: '🍿', maxlength: 8 },
    // Marca de tiempo de la foto personalizada (null = sin foto). Sirve para cambiar la URL y saltarse la caché
    imageVersion: { type: Number, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    inviteCode: { type: String, unique: true, default: generateInviteCode },
    movies: [groupMovieSchema],
  },
  { timestamps: true }
);

// Índice para buscar rápido "los grupos en los que estoy"
groupSchema.index({ members: 1 });

groupSchema.methods.isMember = function (userId) {
  return this.members.some((m) => String(m._id || m) === String(userId));
};
groupSchema.methods.isOwner = function (userId) {
  return String(this.owner._id || this.owner) === String(userId);
};

export const MAX_MEMBERS = 30;
export const MAX_MOVIES = 300;

export default mongoose.model('Group', groupSchema);
